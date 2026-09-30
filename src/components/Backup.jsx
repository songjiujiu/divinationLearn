import React, { useId, useRef, useState } from 'react';
import { BEFORE_RESTORE_KEY, MAX_BACKUP_BYTES, createBackup, parseBackup } from '../lib/backup.js';
import '../backup.css';

function readRollback() {
  try {
    const saved = localStorage.getItem(BEFORE_RESTORE_KEY);
    return saved ? parseBackup(saved) : null;
  } catch { return null; }
}

function summary(state) {
  return [
    [Object.values(state.reader.notes).filter(note => note.trim()).length, '篇阅读笔记'],
    [Object.values(state.reader.bookmarks).filter(Boolean).length, '个收藏'],
    [state.cases.length, '篇旧版案例'], [state.reviews.length, '篇旧版复盘'],
  ];
}

export default function Backup({ state, onRestore, notify, defaultOpen = true }) {
  const inputId = useId();
  const fileInput = useRef(null);
  const readVersion = useRef(0);
  const [pending, setPending] = useState(null);
  const [rollback, setRollback] = useState(readRollback);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function download() {
    setError('');
    try {
      const backup = createBackup(state);
      const text = JSON.stringify(backup, null, 2);
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      if (blob.size > MAX_BACKUP_BYTES) throw new Error('当前档案超过 5 MB，无法生成可直接恢复的备份。请先将阅读笔记和重要记录另行复制保存。');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `易经白话-阅读档案-${backup.exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('已发起阅读档案下载，请保留下载的 JSON 文件。');
      notify?.('已发起完整阅读档案下载');
    } catch (issue) { setError(issue.message || '导出失败，请重试。'); }
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const version = ++readVersion.current;
    setPending(null);
    setError('');
    setMessage('');
    setReading(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('备份文件超过 5 MB，请选择不超过 5 MB 的 JSON 备份。');
      const backup = parseBackup(await file.text());
      if (version === readVersion.current) setPending({ ...backup, name: file.name });
    } catch (issue) {
      if (version === readVersion.current) setError(issue.message || '无法读取该文件，请重试。');
    } finally {
      if (version === readVersion.current) setReading(false);
    }
  }

  function restore() {
    if (!pending) return;
    setError('');
    setMessage('');
    try {
      const previous = createBackup(state);
      const stored = JSON.stringify(previous);
      if (new TextEncoder().encode(stored).byteLength > MAX_BACKUP_BYTES) throw new Error('当前档案超过 5 MB，无法建立完整撤销副本，已取消恢复。');
      let priorSnapshot;
      try { priorSnapshot = localStorage.getItem(BEFORE_RESTORE_KEY); }
      catch { throw new Error('浏览器未能读取已有撤销副本，已取消恢复，当前档案未被替换。'); }
      try { localStorage.setItem(BEFORE_RESTORE_KEY, stored); }
      catch { throw new Error('浏览器未能保存恢复前的副本，已取消恢复。请先导出当前档案，并检查浏览器存储空间或权限。'); }
      try { onRestore(pending.state); }
      catch (restoreIssue) {
        try {
          if (priorSnapshot === null) localStorage.removeItem(BEFORE_RESTORE_KEY);
          else localStorage.setItem(BEFORE_RESTORE_KEY, priorSnapshot);
        } catch {
          // A failed second restore must not appear to retain the first restore's undo point.
          setRollback(null);
          let snapshotStatus = '当前撤销副本无法读取，不能确认它是否仍是之前的副本。';
          try {
            const currentSnapshot = localStorage.getItem(BEFORE_RESTORE_KEY);
            if (currentSnapshot === stored) {
              snapshotStatus = priorSnapshot === null
                ? '本次临时副本未能删除，它保存的是本次操作前的档案。'
                : '当前副本保存的是本次操作前的档案，之前的撤销副本未能还原。';
            } else if (currentSnapshot === null) {
              snapshotStatus = '当前存储中没有撤销副本。';
            } else if (currentSnapshot === priorSnapshot) {
              snapshotStatus = '重新读取后，确认原来的撤销副本仍在存储中。';
            } else {
              snapshotStatus = '当前撤销副本已发生变化，无法确认它对应的时点。';
            }
          } catch { /* The message explicitly reports that the snapshot cannot be checked. */ }
          throw new Error(`${restoreIssue?.message || '恢复失败，当前档案未被替换。'} 还原撤销副本时也遇到错误。${snapshotStatus} 请先导出当前档案保留。`);
        }
        throw restoreIssue;
      }
      setRollback(previous);
      setPending(null);
      setMessage('阅读档案已恢复。需要返回恢复前的内容时，可点击「撤销此次恢复」。');
      notify?.('阅读档案已恢复，支持一键撤销');
    } catch (issue) { setError(issue.message || '恢复失败，当前档案未被替换。'); }
  }

  function undo() {
    setError('');
    try {
      const saved = localStorage.getItem(BEFORE_RESTORE_KEY);
      if (!saved) throw new Error('未找到恢复前的副本，当前档案未被改动。');
      const previous = parseBackup(saved);
      onRestore(previous.state);
      // Keep the stored snapshot if storage becomes unavailable during cleanup.
      try { localStorage.removeItem(BEFORE_RESTORE_KEY); } catch { /* Still recoverable after refresh. */ }
      setRollback(null);
      setPending(null);
      setMessage('已撤销恢复，回到恢复前的阅读档案。');
      notify?.('已回到恢复前的阅读档案');
    } catch (issue) { setError(issue.message || '撤销失败，当前档案未被改动。'); }
  }

  return <details className="backup-panel panel" open={defaultOpen}>
    <summary><span>阅读档案备份</span><small>把笔记与收藏带走</small></summary>
    <div className="backup-content">
      <p>一次保存阅读笔记、收藏和已有记录。换浏览器或换电脑时，可用 JSON 文件恢复；旧版学习档案也可以导入。</p>
      <div className="backup-actions">
        <button type="button" className="button small" onClick={download}>导出完整档案</button>
        <button type="button" className="button outline small" onClick={() => fileInput.current?.click()} disabled={reading}>{reading ? '正在读取…' : '选择备份文件'}</button>
        <label className="backup-file-label" htmlFor={inputId}>选择 JSON 阅读档案，最大 5 MB</label>
        <input ref={fileInput} id={inputId} className="backup-file" type="file" accept=".json,application/json" onChange={chooseFile} />
      </div>
      {pending && <section className="backup-preview" aria-label="待恢复档案预览">
        <h3>确认这份阅读档案</h3>
        <p className="backup-filename">{pending.name}</p>
        <p>导出时间：{new Date(pending.exportedAt).toLocaleString('zh-CN')}</p>
        <dl className="backup-counts">{summary(pending.state).map(([count, label]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
        <p>恢复会替换当前阅读档案；系统会先保存恢复前的副本，以便撤销。备份中的旧版记录也会完整保留。</p>
        <div className="backup-actions"><button type="button" className="button small" onClick={restore}>用此备份恢复</button><button type="button" className="button outline small" onClick={() => setPending(null)}>取消</button></div>
      </section>}
      {rollback && <div className="backup-undo"><p>已保留上一次恢复前的副本。撤销将回到该时刻，恢复后新增的内容可先导出保存。</p><button type="button" className="button outline small" onClick={undo}>撤销此次恢复</button></div>}
      {message && <p className="backup-status" role="status">{message}</p>}
      {error && <p className="backup-error" role="alert">{error}</p>}
      <small className="backup-note">备份由你保存在本地。清除浏览器数据前，记得先导出一份。</small>
    </div>
  </details>;
}
