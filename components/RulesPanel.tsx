import React, { useState, useRef, useMemo } from 'react';
import { Rule, AppState } from '../types';
import { t, Language } from '../translations';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import JoditEditor from 'jodit-react';

interface RulesPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  language: Language;
}

const RulesPanel: React.FC<RulesPanelProps> = ({ state, setState, language }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const editorRef = useRef<any>(null);

  const handleSave = () => {
    const currentContent = content;
    if (!currentContent || !currentContent.trim() || currentContent === '<p><br></p>') return;

    if (editingId) {
      setState(prev => ({
        ...prev,
        rules: prev.rules.map(rule => 
          rule.id === editingId 
            ? { ...rule, content: currentContent, updatedAt: new Date().toISOString() }
            : rule
        )
      }));
    } else {
      const newRule: Rule = {
        id: Date.now().toString(),
        content: currentContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState(prev => ({
        ...prev,
        rules: [newRule, ...(prev.rules || [])]
      }));
    }
    
    setIsAdding(false);
    setEditingId(null);
    setContent('');
  };

  const handleEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setContent(rule.content);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Haqiqatan ham ushbu qoidani o\'chirmoqchimisiz?')) {
      setState(prev => ({
        ...prev,
        rules: prev.rules.filter(rule => rule.id !== id)
      }));
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setContent('');
  };

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Qoida matnini kiriting...',
    height: 400,
    theme: 'default',
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ]
  }), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black theme-text uppercase tracking-tight flex items-center gap-3">
          <span className="p-2 bg-brand-gold/10 text-brand-gold rounded-xl">📋</span>
          {t(language, 'rules')}
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-brand-gold/20 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Yangi qoida
          </button>
        )}
      </div>

      {isAdding && (
        <div className="theme-blue-box p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="bg-white rounded-xl overflow-hidden text-black">
            <JoditEditor
              ref={editorRef}
              value={content}
              config={config}
              onBlur={newContent => setContent(newContent)}
              onChange={newContent => {}}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 theme-text rounded-xl font-black text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-all uppercase tracking-wider"
            >
              <X className="w-4 h-4" />
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-brand-gold/20 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              Saqlash
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {state.rules && state.rules.length > 0 ? (
          state.rules.map(rule => (
            <div key={rule.id} className="theme-blue-box p-6 rounded-2xl border border-white/10 shadow-lg group">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="text-[10px] font-bold theme-text-muted uppercase tracking-wider">
                  {new Date(rule.updatedAt).toLocaleString('ru-RU')}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 bg-black/5 dark:bg-white/5 text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 bg-black/5 dark:bg-white/5 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div 
                className="theme-text text-sm leading-relaxed prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: rule.content }}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 border-dashed">
            <p className="text-sm font-bold theme-text-muted uppercase tracking-wider">Hozircha qoidalar kiritilmagan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesPanel;
