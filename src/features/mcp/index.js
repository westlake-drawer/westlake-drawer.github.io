import React, {useState} from 'react';
import styles from './styles.module.css';

const PATH = '/absolute/path/to/mcp/index.js';

const AGENTS = [
  {
    id: 'claude',
    label: 'Claude',
    note: 'Claude Code. Run this in the repository folder.',
    language: 'bash',
    code: 'claude mcp add westlake-drawer -- node "$(pwd)/mcp/index.js"',
  },
  {
    id: 'codex',
    label: 'Codex',
    note: 'In ~/.codex/config.toml.',
    language: 'toml',
    code: `[mcp_servers.westlake-drawer]
command = "node"
args = ["${PATH}"]`,
  },
  {
    id: 'dsh',
    label: 'DSH',
    note: 'Add to the MCP server list in your DSH settings.',
    language: 'json',
    code: `{
  "mcpServers": {
    "westlake-drawer": {
      "command": "node",
      "args": ["${PATH}"]
    }
  }
}`,
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    note: 'In opencode.json.',
    language: 'json',
    code: `{
  "mcp": {
    "westlake-drawer": {
      "type": "local",
      "command": ["node", "${PATH}"]
    }
  }
}`,
  },
  {
    id: 'workbuddy',
    label: 'Workbuddy',
    note: "Use your client's MCP configuration file.",
    language: 'json',
    code: `{
  "mcpServers": {
    "westlake-drawer": {
      "command": "node",
      "args": ["${PATH}"]
    }
  }
}`,
  },
  {
    id: 'zcode',
    label: 'Zcode',
    note: "Use your client's MCP configuration file.",
    language: 'json',
    code: `{
  "mcpServers": {
    "westlake-drawer": {
      "command": "node",
      "args": ["${PATH}"]
    }
  }
}`,
  },
];

export default function McpSetup() {
  const [active, setActive] = useState(AGENTS[0].id);
  const agent = AGENTS.find((item) => item.id === active) ?? AGENTS[0];

  return (
    <div className={styles.setup}>
      <div className={styles.tabs} role="tablist" aria-label="Agent">
        {AGENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active}
            className={`${styles.tab} ${item.id === active ? styles.tabActive : ''}`}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className={styles.note}>{agent.note}</p>
      <pre className={styles.code}><code>{agent.code}</code></pre>
      <p className={styles.hint}>
        Replace <code>{PATH}</code> with the absolute path of <code>mcp/index.js</code>.
        If your client is not listed, it almost certainly accepts the JSON form above.
      </p>
    </div>
  );
}
