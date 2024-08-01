import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import * as moment from 'moment-timezone';

@Injectable()
export class SalesSummaryService {
  constructor(@InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>) {}

  async getSalesSummaryReport(startDate: string, endDate: string, granularity: string, timezone: string) {
    let groupBy, fromDateExpression, toDateExpression;

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

    // Format the dates to include hours, minutes, and seconds
    return salesSummary.map(summary => ({
      ...summary,
      fromDate: moment(summary.fromDate).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'), // Ensure UTC
      toDate: moment(summary.toDate).utc().format('YYYY-MM-DDTHH:mm:ss[Z]'),     // Ensure UTC
    }));
  }
}
