import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import 'api_service.dart';
import 'local_db_service.dart';

class SyncService extends StateNotifier<bool> {
  final LocalDbService dbService;
  final ApiService apiService;

  SyncService(this.dbService, this.apiService) : super(true); // Demo connectivity toggle

  void toggleOnline() {
    state = !state;
  }

  Future<void> syncReports() async {
    final pending = await dbService.getPendingReports();
    for (var report in pending) {
      await dbService.updateReportSyncStatus(report.id, SyncStatus.syncing);
      
      if (!state) {
        await dbService.updateReportSyncStatus(report.id, SyncStatus.syncFailed);
        continue;
      }
      try {
        await apiService.syncReport(report);
        await dbService.updateReportSyncStatus(report.id, SyncStatus.synced);
      } catch (_) {
        await dbService.updateReportSyncStatus(report.id, SyncStatus.syncFailed);
      }
    }
  }
}

final syncServiceProvider = StateNotifierProvider<SyncService, bool>((ref) {
  return SyncService(LocalDbService(), ApiService());
});
