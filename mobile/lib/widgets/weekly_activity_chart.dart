import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';

class WeeklyActivityChart extends StatelessWidget {
  final List<Report> reports;

  const WeeklyActivityChart({super.key, required this.reports});

  @override
  Widget build(BuildContext context) {
    // Calculate reports per day for the last 7 days
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    final Map<int, int> counts = {for (var i = 0; i < 7; i++) i: 0};
    
    for (var report in reports) {
      final rDate = report.createdAt;
      final day = DateTime(rDate.year, rDate.month, rDate.day);
      final difference = today.difference(day).inDays;
      if (difference >= 0 && difference < 7) {
        counts[difference] = counts[difference]! + 1;
      }
    }

    final maxY = counts.values.isEmpty ? 5.0 : (counts.values.reduce((a, b) => a > b ? a : b) + 2).toDouble();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Weekly Activity',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 150,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: maxY,
                  barTouchData: BarTouchData(
                    enabled: true,
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        return BarTooltipItem(
                          '${rod.toY.round()} reports',
                          const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        );
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          // value represents 'difference' from today (0 = today, 6 = 6 days ago)
                          final date = today.subtract(Duration(days: value.toInt()));
                          final text = DateFormat('E').format(date).substring(0, 3); // Mon, Tue
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              text,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          );
                        },
                        reservedSize: 28,
                      ),
                    ),
                    leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: 2,
                    getDrawingHorizontalLine: (value) {
                      return FlLine(
                        color: AppColors.border.withValues(alpha: 0.5),
                        strokeWidth: 1,
                      );
                    },
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: List.generate(7, (index) {
                    final reverseIndex = 6 - index; // Draw oldest to newest
                    return BarChartGroupData(
                      x: reverseIndex,
                      barRods: [
                        BarChartRodData(
                          toY: counts[reverseIndex]!.toDouble(),
                          color: AppColors.primary,
                          width: 16,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(6),
                            topRight: Radius.circular(6),
                          ),
                        ),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
