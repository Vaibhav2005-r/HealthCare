import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/local_db_service.dart';
import '../services/mock_data.dart';
import '../services/triage_service.dart';
import '../models/models.dart';
import '../services/sync_service.dart';

final localDbProvider = Provider((ref) => LocalDbService());
final mockDataProvider = Provider((ref) => MockDataService());
final triageProvider = Provider((ref) => TriageService());

final reportsProvider = FutureProvider<List<Report>>((ref) async {
  final db = ref.watch(localDbProvider);
  return db.getReports();
});

final pendingReportsProvider = FutureProvider<List<Report>>((ref) async {
  final db = ref.watch(localDbProvider);
  return db.getPendingReports();
});

// We already created syncServiceProvider in sync_service.dart, we'll export it here if needed,
// but it's fine to just import it directly.
