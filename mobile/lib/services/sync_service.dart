import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import 'local_db_service.dart';

class SyncService extends StateNotifier<bool> {
  final LocalDbService dbService;

  SyncService(this.dbService) : super(true); // default true (online)

  void toggleOnline() {
    state = !state;
  }

  Future<void> syncReports() async {
    final pending = await dbService.getPendingReports();
    for (var report in pending) {
      await dbService.updateReportSyncStatus(report.id, SyncStatus.syncing);
      
      // Simulate network delay
      await Future.delayed(const Duration(seconds: 1));

      if (state) { // online
        await dbService.updateReportSyncStatus(report.id, SyncStatus.synced);
      } else { // offline / failure
        await dbService.updateReportSyncStatus(report.id, SyncStatus.syncFailed);
      }
    }
  }
}

final syncServiceProvider = StateNotifierProvider<SyncService, bool>((ref) {
  return SyncService(LocalDbService());
});
