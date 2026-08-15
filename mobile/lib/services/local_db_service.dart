import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/models.dart';

class LocalDbService {
  static final LocalDbService _instance = LocalDbService._internal();
  factory LocalDbService() => _instance;
  LocalDbService._internal();

  Database? _db;

  Future<Database> get db async {
    if (_db != null) return _db!;
    _db = await _initDb();
    return _db!;
  }

  Future<Database> _initDb() async {
    String path = join(await getDatabasesPath(), 'smart_health.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE reports(
            id TEXT PRIMARY KEY,
            age INTEGER,
            sex TEXT,
            village TEXT,
            symptoms TEXT,
            durationDays INTEGER,
            riskTier TEXT,
            syncStatus TEXT,
            createdAt TEXT
          )
        ''');
      },
    );
  }

  Future<void> insertReport(Report report) async {
    final database = await db;
    await database.insert('reports', report.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateReportSyncStatus(String id, SyncStatus status) async {
    final database = await db;
    await database.update(
      'reports',
      {'syncStatus': status.name},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<List<Report>> getReports() async {
    final database = await db;
    final List<Map<String, dynamic>> maps = await database.query('reports', orderBy: 'createdAt DESC');
    return maps.map((map) => Report.fromMap(map)).toList();
  }

  Future<List<Report>> getPendingReports() async {
    final database = await db;
    final List<Map<String, dynamic>> maps = await database.query(
      'reports',
      where: 'syncStatus IN (?, ?)',
      whereArgs: [SyncStatus.draft.name, SyncStatus.queued.name, SyncStatus.syncFailed.name],
    );
    return maps.map((map) => Report.fromMap(map)).toList();
  }
}
