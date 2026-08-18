import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/local_db_service.dart';
import '../services/mock_data.dart';
import '../services/triage_service.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import '../services/sync_service.dart';
import '../services/auth_service.dart';

export '../services/auth_service.dart';
export '../services/sync_service.dart';

final localDbProvider = Provider((ref) => LocalDbService());
final apiServiceProvider = Provider((ref) => ApiService());
final mockDataProvider = Provider((ref) => MockDataService());
final triageProvider = Provider((ref) => TriageService());

final syncServiceProvider = StateNotifierProvider<SyncService, SyncState>((ref) {
  final db = ref.watch(localDbProvider);
  final api = ref.watch(apiServiceProvider);
  return SyncService(db, api);
});

final reportsProvider = FutureProvider<List<Report>>((ref) async {
  final db = ref.watch(localDbProvider);
  return db.getReports();
});

final pendingReportsProvider = FutureProvider<List<Report>>((ref) async {
  final db = ref.watch(localDbProvider);
  return db.getPendingReports();
});

final workerProfileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  return api.fetchWorkerProfile();
});

final villagesProvider = FutureProvider<List<String>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  return api.fetchVillages();
});

final guidanceProtocolsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  return api.fetchClinicalGuidance();
});
