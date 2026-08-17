import '../models/models.dart';

class LocalDbService {
  static final LocalDbService _instance = LocalDbService._internal();
  factory LocalDbService() => _instance;
  LocalDbService._internal();

  final List<Report> _reports = [];

  Future<void> seedDatabaseIfNeeded(List<Report> mockReports) async {
    final count = await getReportCount();
    if (count == 0) {
      _reports.addAll(mockReports);
    }
  }

  Future<void> insertReport(Report report) async {
    _reports.removeWhere((r) => r.id == report.id);
    _reports.add(report);
  }

  Future<void> updateReportSyncStatus(String id, SyncStatus status) async {
    final index = _reports.indexWhere((r) => r.id == id);
    if (index != -1) {
      _reports[index] = _reports[index].copyWith(syncStatus: status);
    }
  }

  Future<List<Report>> getReports() async {
    final sorted = List<Report>.from(_reports);
    sorted.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return sorted;
  }

  Future<int> getReportCount() async {
    return _reports.length;
  }

  Future<List<Report>> getPendingReports() async {
    return _reports.where((r) => 
      r.syncStatus == SyncStatus.draft || 
      r.syncStatus == SyncStatus.queued || 
      r.syncStatus == SyncStatus.syncFailed
    ).toList();
  }
}
