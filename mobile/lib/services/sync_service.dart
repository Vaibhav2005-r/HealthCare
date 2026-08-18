import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/models.dart';
import 'api_service.dart';
import 'local_db_service.dart';

class SyncState {
  final bool isOnline;
  final bool isSyncing;
  final int pendingCount;
  final String? lastSyncTime;
  final String? errorMessage;

  SyncState({
    this.isOnline = true,
    this.isSyncing = false,
    this.pendingCount = 0,
    this.lastSyncTime,
    this.errorMessage,
  });

  SyncState copyWith({
    bool? isOnline,
    bool? isSyncing,
    int? pendingCount,
    String? lastSyncTime,
    String? errorMessage,
  }) {
    return SyncState(
      isOnline: isOnline ?? this.isOnline,
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      errorMessage: errorMessage,
    );
  }
}

class SyncService extends StateNotifier<SyncState> {
  final LocalDbService dbService;
  final ApiService apiService;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  SyncService(this.dbService, this.apiService) : super(SyncState()) {
    refreshPendingCount();
    _initConnectivityListener();
  }

  void _initConnectivityListener() {
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      final isNowOnline = results.isNotEmpty &&
          !results.contains(ConnectivityResult.none);
      
      if (isNowOnline != state.isOnline) {
        state = state.copyWith(isOnline: isNowOnline);
        if (isNowOnline) {
          // Trigger immediate auto-sync when network reconnects
          syncReports();
        }
      }
    });
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  void toggleOnline() {
    state = state.copyWith(isOnline: !state.isOnline);
    if (state.isOnline) {
      syncReports();
    }
  }

  Future<void> refreshPendingCount() async {
    final pending = await dbService.getPendingReports();
    state = state.copyWith(pendingCount: pending.length);
  }

  Future<int> syncReports() async {
    final pending = await dbService.getPendingReports();
    if (pending.isEmpty) {
      state = state.copyWith(pendingCount: 0);
      return 0;
    }

    if (!state.isOnline) {
      state = state.copyWith(
        errorMessage: 'Device is offline. Reports queued in SQLite.',
      );
      return 0;
    }

    state = state.copyWith(isSyncing: true, errorMessage: null);

    int syncedCount = 0;
    try {
      // Mark all as syncing
      for (final report in pending) {
        await dbService.updateReportSyncStatus(report.id, SyncStatus.syncing);
      }

      // Try batch sync via FastAPI endpoint
      try {
        syncedCount = await apiService.syncReportsBatch(pending);
        for (final report in pending) {
          await dbService.updateReportSyncStatus(report.id, SyncStatus.synced);
        }
      } catch (batchErr) {
        // Fallback to sequential sync
        for (final report in pending) {
          try {
            await apiService.syncReport(report);
            await dbService.updateReportSyncStatus(report.id, SyncStatus.synced);
            syncedCount++;
          } catch (_) {
            await dbService.updateReportSyncStatus(report.id, SyncStatus.syncFailed);
          }
        }
      }

      final now = DateTime.now();
      final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

      await refreshPendingCount();
      state = state.copyWith(
        isSyncing: false,
        lastSyncTime: timeStr,
        errorMessage: null,
      );
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        errorMessage: 'Sync failed: $e',
      );
    }

    return syncedCount;
  }
}
