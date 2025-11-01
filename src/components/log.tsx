import { Log } from "@/types"

type LogProps = {
  logs: Log[]
  onClear: () => void
}

export default function LogViewer({ logs, onClear }: LogProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          通信データログ
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Clear logs
        </button>
      </div>
      <div className="space-y-3">
        {/* ログを逆順で表示（新しいものが上） */}
        {[...logs].reverse().map((log, index) => (
          <div
            key={`${logs.length - 1 - index}-${log.timestamp}`}
            className="rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {/* ログヘッダー（タイムスタンプ、タイプ、エンドポイント、ステータス） */}
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">{log.timestamp}</span>
              <span
                className={`rounded px-2 py-0.5 font-medium ${
                  log.type === 'request'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}
              >
                {log.type.toUpperCase()}
              </span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {log.endpoint}
              </span>
              {/* ステータスコード表示 */}
              {log.status && (
                <span
                  className={`rounded px-2 py-0.5 font-mono font-medium ${
                    log.status >= 200 && log.status < 300
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : log.status >= 400
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  }`}
                >
                  {log.status}
                </span>
              )}
            </div>
            {/* データ本体（JSON形式で表示） */}
            <pre className="overflow-x-auto text-left text-xs text-zinc-700 dark:text-zinc-300">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
