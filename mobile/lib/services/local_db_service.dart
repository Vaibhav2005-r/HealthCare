import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/models.dart';

class LocalDbService {
  static final LocalDbService _instance = LocalDbService._internal();
  factory LocalDbService() => _instance;
  LocalDbService._internal();

  Database? _db;
  final List<Report> _memoryFallback = [];

  Future<Database?> _getDatabase() async {
    if (kIsWeb) return null; // Web platform uses in-memory fallback
    if (_db != null) return _db;

    try {
      final dbPath = await getDatabasesPath();
      final path = join(dbPath, 'arogya_reports.db');

      _db = await openDatabase(
        path,
        version: 1,
        onCreate: (Database db, int version) async {
          await db.execute('''
            CREATE TABLE reports (
              id TEXT PRIMARY KEY,
              patientName TEXT,
              age INTEGER,
              sex TEXT,
              contactNumber TEXT,
              village TEXT,
              symptoms TEXT,
              durationDays INTEGER,
              temperature REAL,
              temperatureUnit TEXT,
              comorbidities TEXT,
              medicationTaken TEXT,
              riskTier TEXT,
              syncStatus TEXT,
              createdAt TEXT,
              locationLat REAL,
              locationLng REAL,
              locationAccuracy REAL,
              manualLocationReason TEXT,
              imagePath TEXT
            )
          ''');
        },
      );
      return _db;
    } catch (e) {
      debugPrint('[LocalDbService] SQLite initialization fallback to memory: $e');
      return null;
    }
  }

  Future<void> seedDatabaseIfNeeded(List<Report> mockReports) async {
    final count = await getReportCount();
    if (count == 0) {
      for (final report in mockReports) {
        await insertReport(report);
      }
    }
  }

  Future<void> insertReport(Report report) async {
    final db = await _getDatabase();
    if (db != null) {
      await db.insert(
        'reports',
        report.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } else {
      _memoryFallback.removeWhere((r) => r.id == report.id);
      _memoryFallback.add(report);
    }
  }

  Future<void> updateReportSyncStatus(String id, SyncStatus status) async {
    final db = await _getDatabase();
    if (db != null) {
      await db.update(
        'reports',
        {'syncStatus': status.name},
        where: 'id = ?',
        whereArgs: [id],
      );
    } else {
      final index = _memoryFallback.indexWhere((r) => r.id == id);
      if (index != -1) {
        _memoryFallback[index] = _memoryFallback[index].copyWith(syncStatus: status);
      }
    }
  }

  Future<List<Report>> getReports() async {
    final db = await _getDatabase();
    if (db != null) {
      final List<Map<String, dynamic>> maps = await db.query(
        'reports',
        orderBy: 'createdAt DESC',
      );
      return maps.map((m) => Report.fromMap(m)).toList();
    } else {
      final sorted = List<Report>.from(_memoryFallback);
      sorted.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return sorted;
    }
  }

  Future<int> getReportCount() async {
    final db = await _getDatabase();
    if (db != null) {
      final count = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM reports'),
      );
      return count ?? 0;
    } else {
      return _memoryFallback.length;
    }
  }

  Future<List<Report>> getPendingReports() async {
    final db = await _getDatabase();
    if (db != null) {
      final List<Map<String, dynamic>> maps = await db.query(
        'reports',
        where: 'syncStatus IN (?, ?, ?)',
        whereArgs: [
          SyncStatus.draft.name,
          SyncStatus.queued.name,
          SyncStatus.syncFailed.name,
        ],
        orderBy: 'createdAt ASC',
      );
      return maps.map((m) => Report.fromMap(m)).toList();
    } else {
      return _memoryFallback.where((r) =>
        r.syncStatus == SyncStatus.draft ||
        r.syncStatus == SyncStatus.queued ||
        r.syncStatus == SyncStatus.syncFailed
      ).toList();
    }
  }

  Future<void> clearAll() async {
    final db = await _getDatabase();
    if (db != null) {
      await db.delete('reports');
    }
    _memoryFallback.clear();
  }
}
