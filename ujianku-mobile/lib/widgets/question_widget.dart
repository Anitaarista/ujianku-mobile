import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/theme.dart';
import '../models/question.dart';

/// Widget untuk menampilkan pertanyaan ujian
class QuestionWidget extends StatelessWidget {
  final Question question;
  final String? selectedAnswer;
  final ValueChanged<String> onAnswerSelected;
  final bool showCorrectAnswer;
  final String? correctAnswer;

  const QuestionWidget({
    super.key,
    required this.question,
    this.selectedAnswer,
    required this.onAnswerSelected,
    this.showCorrectAnswer = false,
    this.correctAnswer,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Nomor dan tipe pertanyaan
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Soal ${question.number}',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: question.isEssay
                      ? const Color(0xFFfef3c7)
                      : const Color(0xFFdbeafe),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  question.isEssay ? 'Esai' : 'Pilihan Ganda',
                  style: TextStyle(
                    color: question.isEssay
                        ? const Color(0xFFd97706)
                        : const Color(0xFF2563eb),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (question.points != null) ...[
                const Spacer(),
                Text(
                  '${question.points} poin',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 20),

          // Gambar pertanyaan (jika ada)
          if (question.imageUrl != null && question.imageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: question.imageUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: const Center(
                    child: Icon(Icons.broken_image_outlined, size: 48, color: AppTheme.textHint),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Teks pertanyaan
          Text(
            question.text,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.6,
                ),
          ),
          const SizedBox(height: 24),

          // Opsi jawaban atau area esai
          if (question.isMultipleChoice) ...[
            ...? question.options?.map(
              (option) => _OptionItem(
                label: option.label,
                text: option.text,
                isSelected: selectedAnswer == option.label,
                isCorrect: showCorrectAnswer && option.label == correctAnswer,
                showCorrect: showCorrectAnswer,
                onTap: () => onAnswerSelected(option.label),
              ),
            ),
          ] else ...[
            _EssayInput(
              initialText: selectedAnswer,
              onChanged: onAnswerSelected,
            ),
          ],
        ],
      ),
    );
  }
}

/// Item opsi jawaban pilihan ganda
class _OptionItem extends StatelessWidget {
  final String label;
  final String text;
  final bool isSelected;
  final bool isCorrect;
  final bool showCorrect;
  final VoidCallback onTap;

  const _OptionItem({
    required this.label,
    required this.text,
    required this.isSelected,
    required this.isCorrect,
    required this.showCorrect,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderColor = AppTheme.border;
    Color bgColor = Colors.transparent;
    Color textColor = AppTheme.textPrimary;
    Color labelColor = AppTheme.textSecondary;
    Color labelBgColor = AppTheme.background;

    if (isSelected && !showCorrect) {
      borderColor = AppTheme.primary;
      bgColor = AppTheme.primary.withValues(alpha: 0.08);
      textColor = AppTheme.primary;
      labelColor = Colors.white;
      labelBgColor = AppTheme.primary;
    }

    if (showCorrect) {
      if (isCorrect) {
        borderColor = AppTheme.success;
        bgColor = AppTheme.success.withValues(alpha: 0.08);
        textColor = AppTheme.success;
        labelColor = Colors.white;
        labelBgColor = AppTheme.success;
      } else if (isSelected && !isCorrect) {
        borderColor = AppTheme.error;
        bgColor = AppTheme.error.withValues(alpha: 0.08);
        textColor = AppTheme.error;
        labelColor = Colors.white;
        labelBgColor = AppTheme.error;
      }
    }

    return GestureDetector(
      onTap: showCorrect ? null : onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
        ),
        child: Row(
          children: [
            // Label (A, B, C, D, E)
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: labelBgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  label,
                  style: TextStyle(
                    color: labelColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),

            // Teks opsi
            Expanded(
              child: Text(
                text,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: textColor,
                      fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
                    ),
              ),
            ),

            // Ikon ceklis/salah
            if (showCorrect && isCorrect)
              const Icon(Icons.check_circle, color: AppTheme.success, size: 22),
            if (showCorrect && isSelected && !isCorrect)
              const Icon(Icons.cancel, color: AppTheme.error, size: 22),
          ],
        ),
      ),
    );
  }
}

/// Area input jawaban esai
class _EssayInput extends StatefulWidget {
  final String? initialText;
  final ValueChanged<String> onChanged;

  const _EssayInput({
    this.initialText,
    required this.onChanged,
  });

  @override
  State<_EssayInput> createState() => _EssayInputState();
}

class _EssayInputState extends State<_EssayInput> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialText ?? '');
  }

  @override
  void didUpdateWidget(covariant _EssayInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialText != oldWidget.initialText) {
      final sel = _controller.selection;
      _controller.text = widget.initialText ?? '';
      if (sel.start >= 0 && sel.start <= _controller.text.length) {
        _controller.selection = sel;
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      maxLines: 8,
      decoration: InputDecoration(
        hintText: 'Tulis jawaban Anda di sini...',
        hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textHint,
            ),
        filled: true,
        fillColor: AppTheme.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary, width: 2),
        ),
      ),
      onChanged: widget.onChanged,
    );
  }
}
