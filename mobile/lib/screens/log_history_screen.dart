import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/providers.dart';
import '../services/sync_service.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';
import '../widgets/animated_scale_button.dart' as import_scale_btn;

import 'package:table_calendar/table_calendar.dart';

import '../widgets/risk_distribution_chart.dart';

class LogHistoryScreen extends ConsumerStatefulWidget {
  const LogHistoryScreen({super.key});

  @override
  ConsumerState<LogHistoryScreen> createState() => _LogHistoryScreenState();
}

class _LogHistoryScreenState extends ConsumerState<LogHistoryScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  bool _showCalendar = false;

  @override
  Widget build(BuildContext context) {
    final pendingAsync = ref.watch(
      reportsProvider,
    ); // Let's watch all reports to filter locally
    final syncState = ref.watch(syncServiceProvider);
    final isOnline = syncState.isOnline;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Log History',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: isOnline
                      ? Colors.green.withOpacity(0.1)
                      : Colors.grey.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isOnline ? Colors.green : Colors.grey,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isOnline ? Colors.green : Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isOnline,
                activeColor: AppColors.primary,
                activeTrackColor: AppColors.primary.withOpacity(0.5),
                onChanged: (val) {
                  ref.read(syncServiceProvider.notifier).toggleOnline();
                },
              ),
            ],
          ),
        ],
      ),
      body: pendingAsync.when(
        data: (allReports) {
          // Determine dot markers for calendar
          final Map<DateTime, RiskTier> reportDays = {};
          for (var r in allReports) {
            final d = DateTime(
              r.createdAt.year,
              r.createdAt.month,
              r.createdAt.day,
            );
            if (!reportDays.containsKey(d) ||
                r.riskTier.index > reportDays[d]!.index) {
              reportDays[d] = r.riskTier; // Simplified logic assuming higher index is higher risk, wait, riskTier is an enum: green=0, amber=1, red=2? Actually we can just manually check.
              if (r.riskTier == RiskTier.red)
                reportDays[d] = RiskTier.red;
              else if (r.riskTier == RiskTier.amber &&
                  reportDays[d] != RiskTier.red)
                reportDays[d] = RiskTier.amber;
              else if (r.riskTier == RiskTier.green && reportDays[d] == null)
                reportDays[d] = RiskTier.green;
            }
          }

          final List<Report> filteredReports = _selectedDay == null
              ? allReports
              : allReports
                    .where((r) => isSameDay(r.createdAt, _selectedDay))
                    .toList();

          final pendingReports = filteredReports
              .where((r) => r.syncStatus != SyncStatus.synced)
              .toList();
          final syncedReports = filteredReports
              .where((r) => r.syncStatus == SyncStatus.synced)
              .toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Card(
                  child: Column(
                    children: [
                      ListTile(
                        title: const Text(
                          'Calendar Filter',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        trailing: IconButton(
                          icon: Icon(
                            _showCalendar
                                ? Icons.expand_less
                                : Icons.filter_alt,
                          ),
                          onPressed: () {
                            setState(() {
                              _showCalendar = !_showCalendar;
                            });
                          },
                        ),
                      ),
                      if (_showCalendar)
                        TableCalendar(
                          firstDay: DateTime.utc(2020, 10, 16),
                          lastDay: DateTime.now().add(
                            const Duration(days: 365),
                          ),
                          focusedDay: _focusedDay,
                          selectedDayPredicate: (day) =>
                              isSameDay(_selectedDay, day),
                          onDaySelected: (selectedDay, focusedDay) {
                            setState(() {
                              if (isSameDay(_selectedDay, selectedDay)) {
                                _selectedDay = null; // deselect
                              } else {
                                _selectedDay = selectedDay;
                              }
                              _focusedDay = focusedDay;
                            });
                          },
                          calendarStyle: CalendarStyle(
                            todayDecoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.3),
                              shape: BoxShape.circle,
                            ),
                            selectedDecoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          eventLoader: (day) {
                            final d = DateTime(day.year, day.month, day.day);
                            if (reportDays.containsKey(d)) {
                              return [
                                reportDays[d],
                              ]; // Return list of 1 event to show marker
                            }
                            return [];
                          },
                          calendarBuilders: CalendarBuilders(
                            markerBuilder: (context, day, events) {
                              if (events.isNotEmpty) {
                                final tier = events.first as RiskTier;
                                return Positioned(
                                  bottom: 1,
                                  child: Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: _getRiskColor(tier),
                                    ),
                                  ),
                                );
                              }
                              return null;
                            },
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (!_showCalendar && filteredReports.isNotEmpty)
                RiskDistributionChart(reports: filteredReports),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  children: [
                    if (pendingReports.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 24.0,
                          vertical: 8.0,
                        ),
                        child: Text(
                          'Pending Sync',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      ...pendingReports.map(
                        (report) => _buildReportCard(report),
                      ),
                    ],
                    if (syncedReports.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 24.0,
                          vertical: 8.0,
                        ),
                        child: Text(
                          'Synced',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      ...syncedReports.map(
                        (report) => _buildReportCard(report),
                      ),
                    ],
                    if (filteredReports.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(48.0),
                          child: Column(
                            children: [
                              Icon(
                                Icons.history,
                                size: 64,
                                color: Colors.grey.withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'No logs found for this date',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (pendingReports.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(24.0),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        offset: const Offset(0, -8),
                        blurRadius: 24,
                      ),
                    ],
                  ),
                  child: SafeArea(
                    top: false,
                    child: import_scale_btn.AnimatedScaleButton(
                      onPressed: () async {
                        await ref
                            .read(syncServiceProvider.notifier)
                            .syncReports();
                        ref.invalidate(reportsProvider);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                isOnline
                                    ? 'Sync Complete'
                                    : 'Sync Failed: Offline',
                              ),
                              backgroundColor: isOnline
                                  ? Colors.green
                                  : Colors.red,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      child: Container(
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.cloud_upload, color: Colors.white),
                            const SizedBox(width: 8),
                            const Text(
                              'Sync Now',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildReportCard(Report report) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          context.push('/saved-report-detail', extra: report);
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _getRiskColor(report.riskTier),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${report.patientName.isNotEmpty ? report.patientName : "Patient"} (${report.age}y ${report.sex}) • ${report.village}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${report.symptoms.take(3).join(", ")}${report.symptoms.length > 3 ? "..." : ""}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _getStatusBadge(report.syncStatus),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, size: 20, color: AppColors.textDisabled),
            ],
          ),
        ),
      ),
    );
  }

  Color _getRiskColor(RiskTier tier) {
    switch (tier) {
      case RiskTier.green:
        return AppColors.riskGreen;
      case RiskTier.amber:
        return AppColors.riskAmber;
      case RiskTier.red:
        return AppColors.riskRed;
    }
  }

  Widget _getStatusBadge(SyncStatus status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case SyncStatus.syncing:
        bgColor = Colors.blue.withOpacity(0.2);
        textColor = Colors.blue;
        label = 'Syncing';
        break;
      case SyncStatus.syncFailed:
        bgColor = Colors.red.withOpacity(0.2);
        textColor = Colors.red;
        label = 'Failed';
        break;
      case SyncStatus.synced:
        bgColor = Colors.green.withOpacity(0.2);
        textColor = Colors.green;
        label = 'Synced';
        break;
      default:
        bgColor = Colors.orange.withOpacity(0.2);
        textColor = Colors.orange;
        label = 'Pending';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
