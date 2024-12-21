import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
const { ObjectId } = require('mongodb');
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import * as moment from 'moment-timezone';
import { UserSettingsService } from '../../user-management/services/user-settings.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

@Injectable()
export class SalesSummaryService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private userSettingsService: UserSettingsService,
    private readonly configService: ConfigService
  ) {}

  async getSalesSummaryReport(req: Request, startDate: string, endDate: string, granularity: string, timezone: string) {
    let groupBy, fromDateExpression, toDateExpression;

    const companyId = await this.getActiveCompanyOfCurrentUser(req)
  
    // Convert startDate and endDate to cover the entire day in the specified timezone
    const startOfDay = moment.tz(startDate, timezone).startOf('day').toDate();
    const endOfDay = moment.tz(endDate, timezone).endOf('day').toDate();
  
    switch (granularity) {
      case 'daily':
        groupBy = {
          year: { $year: { date: "$date", timezone: timezone } },
          month: { $month: { date: "$date", timezone: timezone } },
          day: { $dayOfMonth: { date: "$date", timezone: timezone } },
        };
        fromDateExpression = {
          $dateFromParts: {
            year: { $year: { date: "$date", timezone: timezone } },
            month: { $month: { date: "$date", timezone: timezone } },
            day: { $dayOfMonth: { date: "$date", timezone: timezone } },
            hour: 0,
            minute: 0,
            second: 0,
            timezone: timezone,
          },
        };
        toDateExpression = {
          $dateFromParts: {
            year: { $year: { date: "$date", timezone: timezone } },
            month: { $month: { date: "$date", timezone: timezone } },
            day: { $dayOfMonth: { date: "$date", timezone: timezone } },
            hour: 23,
            minute: 59,
            second: 59,
            timezone: timezone,
          },
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: { date: "$date", timezone: timezone } },
          week: { $isoWeek: { date: "$date", timezone: timezone } },
        };
        fromDateExpression = {
          $dateFromParts: {
            isoWeekYear: { $isoWeekYear: { date: "$date", timezone: timezone } },
            isoWeek: { $isoWeek: { date: "$date", timezone: timezone } },
            isoDayOfWeek: 1, // Start of ISO week is Monday
            hour: 0,
            minute: 0,
            second: 0,
            timezone: timezone,
          },
        };
        toDateExpression = {
          $dateAdd: {
            startDate: fromDateExpression,
            unit: "day",
            amount: 6,
          },
        };
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: { date: "$date", timezone: timezone } },
          month: { $month: { date: "$date", timezone: timezone } },
        };
        fromDateExpression = {
          $dateFromParts: {
            year: { $year: { date: "$date", timezone: timezone } },
            month: { $month: { date: "$date", timezone: timezone } },
            day: 1,
            hour: 0,
            minute: 0,
            second: 0,
            timezone: timezone,
          },
        };
        toDateExpression = {
          $dateAdd: {
            startDate: {
              $dateFromParts: {
                year: { $year: { date: "$date", timezone: timezone } },
                month: { $add: [{ $month: { date: "$date", timezone: timezone } }, 1] },
                day: 1,
              },
            },
            unit: "day",
            amount: -1,
          },
        };
        break;
    }    
  
    const salesSummary = await this.invoiceModel.aggregate([
      // Match invoices within the specified date range
      {
        $match: {
          date: {
            $gte: startOfDay,  // Ensure dates cover the entire day in the local timezone
            $lte: endOfDay,    // Ensure dates cover the entire day in the local timezone
          },
          company: new Types.ObjectId(companyId), // Filter by company ID
          deleted: false // Optional: if you want to exclude deleted invoices
        },
      },
      // Unwind items array
      { $unwind: "$items" },
      // Unwind lots array within items
      { $unwind: "$items.lots" },
      // Convert lotId to ObjectId
      {
        $addFields: {
          "items.lots.lotId": { $toObjectId: "$items.lots.lotId" }
        }
      },
      // Join with the inventories to get purchase prices for each lot
      {
        $lookup: {
          from: 'inventories',
          localField: 'items.lots.lotId',
          foreignField: '_id',
          as: 'inventoryData'
        }
      },
      { $unwind: "$inventoryData" },
      // Add a new field to calculate the cost for each lot
      {
        $addFields: {
          lotCost: { $multiply: ["$inventoryData.purchasePrice", "$items.lots.quantity"] }
        }
      },
      // Group by invoice to calculate the total revenue and cost for each invoice
      {
        $group: {
          _id: "$_id",
          date: { $first: "$date" },
          totalRevenue: { $first: "$amountDue" },
          totalCost: { $sum: "$lotCost" }
        }
      },
      // Group by the specified granularity and calculate the total metrics
      {
        $group: {
          _id: groupBy,
          totalCost: { $sum: "$totalCost" },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalRevenue" },
          averageInvoiceAmount: { $avg: "$totalRevenue" },
          fromDate: { $first: "$date" },  // get the first date in the group
          toDate: { $last: "$date" }  // get the last date in the group
        }
      },
      // Sort by the fromDate
      {
        $sort: {
          fromDate: 1,
        }
      },
      // Project the results to a more readable format
      {
        $project: {
          _id: 0,
          fromDate: 1,
          toDate: 1,
          totalSales: 1,
          totalRevenue: 1,
          averageInvoiceAmount: 1,
          totalCost: 1
        }
      }
    ]);
  
    // Format the dates to include hours, minutes, and seconds
    return salesSummary.map(summary => ({
      ...summary,
      fromDate: moment(summary.fromDate).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'), // Ensure UTC
      toDate: moment(summary.toDate).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),     // Ensure UTC
    }));
  }
  
  async getSalesByProduct(req: Request, startDate: string, endDate: string, timezone: string) {

    const companyId = await this.getActiveCompanyOfCurrentUser(req)

    // Convert startDate and endDate to cover the entire day in the specified timezone
    const startOfDay = moment.tz(startDate, timezone).startOf('day').toDate();
    const endOfDay = moment.tz(endDate, timezone).endOf('day').toDate();
  
    console.log('Start of Day:', startOfDay);
    console.log('End of Day:', endOfDay);
  
    const salesByProduct = await this.invoiceModel.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          company: new Types.ObjectId(companyId), // Filter by company ID
          deleted: false, // Optional: if you want to exclude deleted invoices
        },
      },
      {
        $unwind: '$items', // Deconstructs the array field 'items' in each document
      },
      {
        $unwind: '$items.lots', // Deconstructs the array field 'lots' in each item
      },
      {
        $addFields: {
          "items.lots.lotId": { $toObjectId: "$items.lots.lotId" }
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: 'items.lots.lotId',
          foreignField: '_id',
          as: 'inventoryData'
        }
      },
      { 
        $unwind: "$inventoryData" 
      },
      {
        $group: {
          _id: '$items.item', // Group by product ID
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          averagePrice: { $avg: '$items.price' },
          totalCost: { $sum: { $multiply: ['$inventoryData.purchasePrice', '$items.lots.quantity'] } }
        },
      },
      {
        $addFields: {
          productObjectId: { $toObjectId: '$_id' }, // Convert string to ObjectId for matching
        },
      },
      {
        $lookup: {
          from: 'items', // The correct collection name
          localField: 'productObjectId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $unwind: '$productDetails',
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$productDetails.name',
          baseUnitOfMeasure: '$productDetails.baseUnitOfMeasure',
          totalQuantitySold: 1,
          totalRevenue: 1,
          averagePrice: 1,
          totalCost: 1
        },
      },
      {
        $sort: {
          productName: 1,
        },
      },
    ]);
  
    return salesByProduct;
  }

  async getActiveCompanyOfCurrentUser(req: Request): Promise<any> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new NotFoundException(`Unauthoriazed!`);
    }
    try {
      
      const [, token] = authHeader.split(' ');
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub.toString();
      const { company } = await this.userSettingsService.getByUserId(userId);
      if (!company) {
        throw new NotFoundException(`Select a company from settings.`);
      }
      return company;
    } catch (error) {
      throw new NotFoundException(`Select a company from settings.`);
    }
  }

  async getSalesByCustomer(req: Request, startDate: string, endDate: string, timezone: string) {
    const companyId = await this.getActiveCompanyOfCurrentUser(req);
  
    // Convert startDate and endDate to cover the entire day in the specified timezone
    const startOfDay = moment.tz(startDate, timezone).startOf('day').toDate();
    const endOfDay = moment.tz(endDate, timezone).endOf('day').toDate();
  
    console.log('Start of Day:', startOfDay);
    console.log('End of Day:', endOfDay);
  
    const salesByCustomer = await this.invoiceModel.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          company: new Types.ObjectId(companyId), // Filter by company ID
          deleted: false, // Optional: if you want to exclude deleted invoices
        },
      },
      {
        $unwind: '$items', // Deconstructs the array field 'items' in each document
      },
      {
        $unwind: '$items.lots', // Deconstructs the array field 'lots' in each item
      },
      {
        $addFields: {
          "items.lots.lotId": { $toObjectId: "$items.lots.lotId" }
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: 'items.lots.lotId',
          foreignField: '_id',
          as: 'inventoryData'
        }
      },
      { 
        $unwind: "$inventoryData" 
      },
      {
        $group: {
          _id: {
            customer: '$customer',
            invoice: '$_id'
          }, // Group by customer ID and invoice ID to get unique invoices
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          averagePrice: { $avg: '$items.price' },
          totalCost: { $sum: { $multiply: ['$inventoryData.purchasePrice', '$items.lots.quantity'] } }
        },
      },
      {
        $group: {
          _id: '$_id.customer', // Group by customer ID to get aggregated results
          totalQuantitySold: { $sum: '$totalQuantitySold' },
          totalRevenue: { $sum: '$totalRevenue' },
          averagePrice: { $avg: '$averagePrice' },
          totalCost: { $sum: '$totalCost' },
          totalSales: { $sum: 1 } // Count of unique invoices
        }
      },
      {
        $addFields: {
          customerObjectId: { $toObjectId: '$_id' }, // Convert string to ObjectId for matching
        },
      },
      {
        $lookup: {
          from: 'customers', // The correct collection name
          localField: 'customerObjectId',
          foreignField: '_id',
          as: 'customerDetails',
        },
      },
      {
        $unwind: '$customerDetails',
      },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          customerName: '$customerDetails.name',
          totalSales: 1, // Total number of invoices
          totalQuantitySold: 1,
          totalRevenue: 1,
          averagePrice: 1,
          totalCost: 1
        },
      },
      {
        $sort: {
          customerName: 1,
        },
      },
    ]);
  
    return salesByCustomer;
  }
  
  
  
  
}
