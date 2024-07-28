import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';

@Injectable()
export class SalesSummaryService {
  constructor(@InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>) {}

  async getSalesSummaryReport(startDate: string, endDate: string, granularity: string) {
    let groupBy, startDateExpression, endDateExpression;

    switch (granularity) {
      case 'daily':
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        };
        startDateExpression = {
          $dateFromParts: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
        };
        endDateExpression = startDateExpression;
        break;
      case 'weekly':
        groupBy = {
          year: { $year: "$date" },
          week: { $week: "$date" },
        };
        startDateExpression = {
          $dateFromParts: {
            year: { $year: "$date" },
            isoWeek: { $isoWeek: "$date" },
          },
        };
        endDateExpression = {
          $dateAdd: {
            startDate: startDateExpression,
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
        startDateExpression = {
          $dateFromParts: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: 1,
          },
        };
        endDateExpression = {
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
            $gte: new Date(startDate),
            $lte: new Date(endDate),
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
        },
      },
      // Add fields for startDate and endDate
      {
        $addFields: {
          startDate: startDateExpression,
          endDate: endDateExpression,
        },
      },
      // Sort by the startDate
      {
        $sort: {
          startDate: 1,
        },
      },
      // Project the results to a more readable format
      {
        $project: {
          _id: 0,
          startDate: 1,
          endDate: 1,
          totalSales: 1,
          totalRevenue: 1,
          averageInvoiceAmount: 1,
        },
      },
    ]);

    // Format the dates to 'YYYY-MM-DD'
    return salesSummary.map(summary => ({
      ...summary,
      startDate: moment(summary.startDate).format('YYYY-MM-DD'),
      endDate: moment(summary.endDate).format('YYYY-MM-DD'),
    }));
  }
}
