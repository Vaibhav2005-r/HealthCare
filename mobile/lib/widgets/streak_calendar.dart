import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import 'package:intl/intl.dart';

class StreakCalendar extends StatelessWidget {
  final List<Report> reports;

  const StreakCalendar({super.key, required this.reports});

  @override
  Widget build(BuildContext context) {
    // Generate map of Date to report count for the last 35 days
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    final Map<DateTime, int> reportCounts = {};
    for (int i = 0; i < 35; i++) {
      reportCounts[today.subtract(Duration(days: i))] = 0;
    }

    for (var report in reports) {
      final rDate = report.createdAt;
      final day = DateTime(rDate.year, rDate.month, rDate.day);
      if (reportCounts.containsKey(day)) {
        reportCounts[day] = reportCounts[day]! + 1;
      }
    }

    // Calculate streak
    int currentStreak = 0;
    for (int i = 0; i < 35; i++) {
      final day = today.subtract(Duration(days: i));
      if (reportCounts[day]! > 0) {
        currentStreak++;
      } else if (i > 0) { // If today is 0, we allow a 0 today and still count yesterday, but let's be strict: if it's 0 and not today, break.
        if (i == 0) continue; // Give them until end of day today
        break;
      }
    }

    // Build grid (7 columns x 5 rows, or 7 rows x 5 columns like github?)
    // Github is usually weeks as columns, days of week as rows.
    // Let's do 7 rows (Mon-Sun), 5 columns (last 5 weeks)
    // To keep it simple in Flutter, we can just render a Wrap or a grid of squares.
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Activity Streak',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.local_fire_department, color: AppColors.primary, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        '$currentStreak Days',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildCalendarGrid(context, reportCounts, today),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendarGrid(BuildContext context, Map<DateTime, int> reportCounts, DateTime today) {
    // Generate dates in correct order: oldest first (top-left) to newest (bottom-right)
    // We want 7 columns (days of week) and 5 rows (weeks)
    // Actually, simple GridView with 7 cross axis count is standard (like a calendar).
    // Let's generate a flat list of 35 days, oldest to newest.
    final List<DateTime> orderedDays = [];
    for (int i = 34; i >= 0; i--) {
      orderedDays.add(today.subtract(Duration(days: i)));
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        // We have 7 columns. Calculate size of each cell
        // 7 * size + 6 * gap = constraints.maxWidth
        final gap = 4.0;
        final size = (constraints.maxWidth - (6 * gap)) / 7;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: orderedDays.map((day) {
            final count = reportCounts[day] ?? 0;
            return Tooltip(
              message: '${DateFormat('MMM d').format(day)}: $count reports',
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  color: _getColorForCount(count),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Color _getColorForCount(int count) {
    if (count == 0) return AppColors.border.withValues(alpha: 0.5);
    if (count == 1) return AppColors.primaryLight.withValues(alpha: 0.4);
    if (count == 2) return AppColors.primaryLight.withValues(alpha: 0.7);
    return AppColors.primary;
  }
}
