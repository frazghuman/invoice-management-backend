import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import * as moment from 'moment';

@Injectable()
export class SalesSummaryService {
  constructor(@InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>) {}

  async getSalesSummaryReport(startDate: string, endDate: string, granularity: string) {
    let groupBy, fromDateExpression, toDateExpression;

    switch (granularity) {
      case 'daily':
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        };
        fromDateExpression = {
          $dateFromParts: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
        };
        toDateExpression = fromDateExpression;
        break;
      case 'weekly':
        groupBy = {
          year: { $year: "$date" },
          week: { $isoWeek: "$date" },
        };
        fromDateExpression = {
          $dateFromParts: {
            isoWeekYear: { $isoWeekYear: "$date" },
            isoWeek: { $isoWeek: "$date" },
            isoDayOfWeek: 1, // Start of ISO week is Monday
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
          year: { $year: "$date" },
          month: { $month: "$date" },
        };
        fromDateExpression = {
          $dateFromParts: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: 1,
          },
        };
        toDateExpression = {
          $dateAdd: {
            startDate: {
              $dateFromParts: {
                year: { $year: "$date" },
                month: { $add: [{ $month: "$date" }, 1] },
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
            $gte: new Date(startDate),  // Ensure dates are in ISO format
            $lte: new Date(endDate),    // Ensure dates are in ISO format
          },
          deleted: false // Optional: if you want to exclude deleted invoices
        },
      },
      // Group by the specified granularity
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amountDue" },
          averageInvoiceAmount: { $avg: "$amountDue" },
          fromDate: { $first: "$date" },  // get the first date in the group
          toDate: { $last: "$date" }  // get the last date in the group
        },
      },
      // Sort by the fromDate
      {
        $sort: {
          fromDate: 1,
        },
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
        },
      },
    ]);

    // Format the dates to 'YYYY-MM-DD'
    return salesSummary.map(summary => ({
      ...summary,
      fromDate: moment(summary.fromDate).utc().format('YYYY-MM-DD'), // Ensure UTC
      toDate: moment(summary.toDate).utc().format('YYYY-MM-DD'),     // Ensure UTC
    }));
  }
}
