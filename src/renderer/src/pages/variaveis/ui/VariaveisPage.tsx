import { useState } from 'react';
import { useDatasetStore } from '@/entities/dataset';
import './variaveis-page.scss';

export function VariaveisPage() {
  const columns = useDatasetStore((s) => s.columns);
  const rows = useDatasetStore((s) => s.rows);
  const activeRowIndex = useDatasetStore((s) => s.activeRowIndex);
  const addColumn = useDatasetStore((s) => s.addColumn);
  const removeColumn = useDatasetStore((s) => s.removeColumn);
  const addRow = useDatasetStore((s) => s.addRow);
  const removeRow = useDatasetStore((s) => s.removeRow);
  const setCell = useDatasetStore((s) => s.setCell);
  const setActiveRow = useDatasetStore((s) => s.setActiveRow);
  const [newCol, setNewCol] = useState('');

  return (
    <div className="variaveis-page">
      <div className="variaveis-page__body">
        <p className="variaveis-page__desc">
          Cada <strong>coluna</strong> é uma variável (referenciada como{' '}
          <code>{`{{coluna}}`}</code> nos steps). Cada <strong>linha</strong> é
          uma massa de teste; a linha selecionada abaixo é a que roda no
          playback.
        </p>

        <div className="variaveis-page__toolbar">
          <input
            value={newCol}
            onChange={(e) => setNewCol(e.target.value)}
            placeholder="nome da coluna (ex: agencia)"
            aria-label="Nova coluna"
            className="variaveis-page__input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCol.trim()) {
                addColumn(newCol);
                setNewCol('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newCol.trim()) {
                addColumn(newCol);
                setNewCol('');
              }
            }}
            className="variaveis-page__btn variaveis-page__btn--primary"
          >
            + Coluna
          </button>
          <button
            type="button"
            onClick={addRow}
            disabled={columns.length === 0}
            className="variaveis-page__btn"
          >
            + Massa
          </button>
        </div>

        {columns.length === 0 ? (
          <div className="variaveis-page__empty">
            Nenhuma coluna ainda. Crie a primeira coluna (ex.{' '}
            <code>agencia</code>) para começar.
          </div>
        ) : (
          <div className="variaveis-page__table-wrap">
            <table className="variaveis-page__table">
              <thead>
                <tr>
                  <th>Ativa</th>
                  {columns.map((c) => (
                    <th key={c}>
                      <span className="variaveis-page__col-name">{c}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remover coluna "${c}"?`))
                            removeColumn(c);
                        }}
                        aria-label={`Remover coluna ${c}`}
                        className="variaveis-page__col-remove"
                      >
                        ×
                      </button>
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="radio"
                        name="variaveis-active-row"
                        checked={i === activeRowIndex}
                        onChange={() => setActiveRow(i)}
                        aria-label={`Ativar massa ${i + 1}`}
                      />
                    </td>
                    {columns.map((c) => (
                      <td key={c}>
                        <input
                          value={row[c] ?? ''}
                          onChange={(e) => setCell(i, c, e.target.value)}
                          aria-label={`${c} da massa ${i + 1}`}
                          className="variaveis-page__cell-input"
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={rows.length <= 1}
                        aria-label={`Remover massa ${i + 1}`}
                        className="variaveis-page__row-remove"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="variaveis-page__footer">
          {rows.length} massa{rows.length === 1 ? '' : 's'} · {columns.length}{' '}
          coluna{columns.length === 1 ? '' : 's'} · massa ativa no playback:{' '}
          <strong>#{activeRowIndex + 1}</strong>
        </p>
      </div>
    </div>
  );
}
