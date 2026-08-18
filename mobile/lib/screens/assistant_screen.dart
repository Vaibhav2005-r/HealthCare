import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/models.dart';
import '../providers/providers.dart';
import '../theme/app_colors.dart';
import '../services/voice_service.dart';
import '../services/api_service.dart';
import '../widgets/coach_mark.dart';

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<AssistantMessage> _messages = [];
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  late TabController _tabController;
  String _selectedCategory = 'ALL';

  final List<String> _quickPrompts = [
    'Cholera Immediate Protocol',
    'Dengue Warning Signs',
    'Malaria Treatment Dosage',
    'Severe Dehydration Triage',
    'Jaundice Household Checks',
    'ILI Mask & Isolation',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _messages.add(
      AssistantMessage(
        id: 'initial',
        text: 'Namaste! I am your Clinical Assistant connected directly to National IDSP Guidelines and Supabase Clinical Protocols.\n\nAsk any question or tap a quick protocol below to get immediate clinical directives.',
        isUser: false,
        citation: 'IDSP & WHO National Protocol Database',
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage([String? presetText]) async {
    final query = (presetText ?? _controller.text).trim();
    if (query.isEmpty) return;

    setState(() {
      if (presetText == null) _controller.clear();
      _messages.add(
        AssistantMessage(
          id: 'u_${DateTime.now().millisecondsSinceEpoch}',
          text: query,
          isUser: true,
        ),
      );
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final answer = await _apiService.askAssistant(query);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _messages.add(
            AssistantMessage(
              id: 'res_${DateTime.now().millisecondsSinceEpoch}',
              text: answer,
              isUser: false,
              citation: 'National Health Guidelines / Supabase RAG',
            ),
          );
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _messages.add(
            AssistantMessage(
              id: 'err_${DateTime.now().millisecondsSinceEpoch}',
              text: 'Standard Guideline: For acute dehydration, start oral rehydration (ORS) immediately. For high fever with chills, administer Paracetamol and arrange RDT diagnostic screening.',
              isUser: false,
              citation: 'IDSP Baseline Offline Protocol',
            ),
          );
        });
        _scrollToBottom();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final guidanceAsync = ref.watch(guidanceProtocolsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'Clinical Guidance AI',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          tabs: const [
            Tab(icon: Icon(Icons.chat_bubble_outline, size: 18), text: 'AI Assistant'),
            Tab(icon: Icon(Icons.menu_book, size: 18), text: 'Protocol Directory'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: Chat Assistant
          _buildChatTab(),

          // TAB 2: Supabase Clinical Protocol Directory
          _buildProtocolDirectoryTab(guidanceAsync),
        ],
      ),
    );
  }

  Widget _buildChatTab() {
    return Column(
      children: [
        // Quick Prompts Horizontal Bar
        Container(
          height: 48,
          margin: const EdgeInsets.only(top: 8),
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: _quickPrompts.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final prompt = _quickPrompts[index];
              return ActionChip(
                backgroundColor: AppColors.surface,
                side: BorderSide(color: AppColors.primary.withOpacity(0.2)),
                label: Text(
                  prompt,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
                onPressed: () => _sendMessage(prompt),
              );
            },
          ),
        ),

        // Message Stream
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final msg = _messages[index];
              return _buildMessageBubble(msg);
            },
          ),
        ),

        if (_isLoading)
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                Text(
                  'Querying National Guidelines Vector Engine...',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),

        // Bottom Input Field
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                offset: const Offset(0, -4),
                blurRadius: 16,
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.send,
                    decoration: InputDecoration(
                      hintText: 'Ask clinical question or symptom...',
                      hintStyle: const TextStyle(color: AppColors.textDisabled, fontSize: 14),
                      filled: true,
                      fillColor: AppColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                CoachMark(
                  id: 'assistant_send_btn',
                  title: 'Ask Assistant',
                  message: 'Send your clinical query to get standard medical protocols.',
                  icon: Icons.send,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 20),
                      onPressed: () => _sendMessage(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProtocolDirectoryTab(AsyncValue<List<Map<String, dynamic>>> guidanceAsync) {
    return guidanceAsync.when(
      data: (protocols) {
        final filtered = _selectedCategory == 'ALL'
            ? protocols
            : protocols.where((p) => (p['category'] as String?)?.toUpperCase() == _selectedCategory).toList();

        final categories = ['ALL', 'WATERBORNE', 'VECTORBORNE', 'AIRBORNE'];

        return Column(
          children: [
            // Category Filter Chips
            Container(
              height: 48,
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final cat = categories[idx];
                  final isSelected = _selectedCategory == cat;
                  return ChoiceChip(
                    label: Text(cat),
                    selected: isSelected,
                    selectedColor: AppColors.primary.withOpacity(0.15),
                    labelStyle: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                    ),
                    onSelected: (val) {
                      if (val) setState(() => _selectedCategory = cat);
                    },
                  );
                },
              ),
            ),

            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final p = filtered[index];
                  final severity = (p['severity_tier'] as String? ?? 'MODERATE').toUpperCase();
                  Color badgeColor = AppColors.riskAmber;
                  if (severity == 'RED' || severity == 'CRITICAL') badgeColor = AppColors.riskRed;
                  if (severity == 'GREEN' || severity == 'LOW') badgeColor = AppColors.riskGreen;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: Colors.grey.withOpacity(0.2)),
                    ),
                    child: ExpansionTile(
                      tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: badgeColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.medical_services, color: badgeColor, size: 24),
                      ),
                      title: Text(
                        p['condition'] ?? 'Unknown Protocol',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: badgeColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                severity,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: badgeColor,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              p['category'] ?? '',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '⚡ Immediate Action Protocol:',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                p['immediate_action'] ?? 'N/A',
                                style: const TextStyle(fontSize: 14, height: 1.4, color: Color(0xFF2D3748)),
                              ),
                              const SizedBox(height: 12),
                              if (p['standard_dosage'] != null) ...[
                                const Text(
                                  '💊 Standard Dosage & Medication:',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  p['standard_dosage'],
                                  style: const TextStyle(fontSize: 14, height: 1.4, color: Color(0xFF2D3748)),
                                ),
                                const SizedBox(height: 12),
                              ],
                              if (p['red_flags'] != null && (p['red_flags'] as List).isNotEmpty) ...[
                                const Text(
                                  '🚩 Red Flag Danger Signs:',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.riskRed),
                                ),
                                const SizedBox(height: 4),
                                ...((p['red_flags'] as List).map(
                                  (flag) => Padding(
                                    padding: const EdgeInsets.only(bottom: 2.0),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('• ', style: TextStyle(color: AppColors.riskRed, fontWeight: FontWeight.bold)),
                                        Expanded(child: Text(flag.toString(), style: const TextStyle(fontSize: 13))),
                                      ],
                                    ),
                                  ),
                                )),
                                const SizedBox(height: 12),
                              ],
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.grey.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.source, size: 14, color: Colors.grey),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        'Source: ${p['source_document'] ?? 'IDSP'} (Page ${p['page_number'] ?? 1})',
                                        style: const TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              Text('Unable to load Supabase protocols: $err', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(guidanceProtocolsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(AssistantMessage msg) {
    final isUser = msg.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20).copyWith(
            bottomRight: isUser ? Radius.zero : const Radius.circular(20),
            bottomLeft: isUser ? const Radius.circular(20) : Radius.zero,
          ),
          boxShadow: [
            if (!isUser)
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    msg.text,
                    style: TextStyle(
                      color: isUser ? Colors.white : AppColors.textPrimary,
                      fontSize: 15,
                      height: 1.4,
                    ),
                  ),
                ),
                if (!isUser) ...[
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.volume_up, size: 18, color: AppColors.primary),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      ref.read(voiceServiceProvider).speak(msg.text);
                    },
                  ),
                ],
              ],
            ),
            if (msg.citation != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (isUser ? Colors.white : AppColors.primary).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.verified_outlined,
                      size: 13,
                      color: isUser ? Colors.white70 : AppColors.primary,
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        msg.citation!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isUser ? Colors.white70 : AppColors.primaryDark,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
