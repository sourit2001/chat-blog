export const allMbtiRoles = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP"
] as const;

export const mbtiGroups = [
  { name: '分析家', color: '#A855F7', roles: ["INTJ", "INTP", "ENTJ", "ENTP"] },
  { name: '外交官', color: '#22C55E', roles: ["INFJ", "INFP", "ENFJ", "ENFP"] },
  { name: '守护者', color: '#3B82F6', roles: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"] },
  { name: '探险家', color: '#EAB308', roles: ["ISTP", "ISFP", "ESTP", "ESFP"] }
];

export const parseMbtiGroupReply = (content: string, viewMode: 'mbti' | 'game') => {
  const lines = content.split('\n');
  const roles = allMbtiRoles;
  type Role = (typeof roles)[number] | string;

  let introLines: string[] = [];
  let outroLines: string[] = [];
  let currentRole: Role | null = null;
  let buffer: string[] = [];
  const roleBlocks: { role: Role; text: string }[] = [];

  const nameToSlot: Record<string, string> = {
    '祁煜': 'ENTJ',
    '黎深': 'ISTJ',
    '沈星回': 'ENFP',
    '夏以昼': 'INFP',
    '秦彻': 'ENFJ',
  };

  const roleRegex = /^[-*\s]*(?:\*{1,3}|#+)?\s*(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP|祁煜|黎深|沈星回|夏以昼|秦彻)[：:]/i;
  const summaryRegex = /^[-*\s]*(?:\*{1,3}|#+)?\s*(小结|总结|总而言之)[：:]/i;

  for (const line of lines) {
    const match = line.match(roleRegex);
    const summaryMatch = line.match(summaryRegex);

    if (match) {
      if (currentRole) {
        roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
      } else if (buffer.length > 0) {
        introLines = buffer.slice();
      }
      const tag = match[1].toUpperCase();
      const mapped = viewMode === 'game' ? tag : (nameToSlot[tag] || tag);
      currentRole = mapped;
      buffer = [line.replace(roleRegex, '').trim()];
    } else if (summaryMatch) {
      if (currentRole) {
        roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
        currentRole = null;
      }
      buffer = [line.replace(summaryRegex, '').trim()];
      outroLines = buffer;
    } else {
      buffer.push(line);
    }
  }

  if (currentRole) {
    roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
  } else if (outroLines.length === 0 && buffer.length > 0 && introLines.length === 0) {
    introLines = buffer.slice();
  }

  return { intro: introLines.join('\n').trim(), roles: roleBlocks, outro: outroLines.join('\n').trim() };
};

export const getRoleEmoji = (role: string, mode: 'mbti' | 'game') => {
  if (mode === 'game') {
    switch (role) {
      case 'ENTJ':
      case '祁煜':
        return '\ud83d\udd25';
      case 'ISTJ':
      case '黎深':
        return '\ud83e\ude7a';
      case 'ENFP':
      case '沈星回':
        return '\u2600\ufe0f';
      case 'INFP':
      case '夏以昼':
        return '\ud83c\udfa8';
      case 'ENFJ':
      case '秦彻':
        return '\ud83c\udf11';
      default:
        return '\ud83c\udfae';
    }
  }

  switch (role) {
    case 'INTJ': return '♟️';
    case 'INTP': return '🧪';
    case 'ENTJ': return '🧠';
    case 'ENTP': return '🧨';
    case 'INFJ': return '🔮';
    case 'INFP': return '🌿';
    case 'ENFJ': return '😊';
    case 'ENFP': return '🌟';
    case 'ISTJ': return '📋';
    case 'ISFJ': return '🛡️';
    case 'ESTJ': return '📢';
    case 'ESFJ': return '🤝';
    case 'ISTP': return '🛠️';
    case 'ISFP': return '��';
    case 'ESTP': return '⚡';
    case 'ESFP': return '🎉';
    default: return '💬';
  }
};

export const getRoleLabel = (role: string, mode: 'mbti' | 'game') => {
  if (mode === 'mbti') return role;
  const mapping: Record<string, string> = {
    'ENTJ': '祁煜',
    'ISTJ': '黎深',
    'ENFP': '沈星回',
    'INFP': '夏以昼',
    'ENFJ': '秦彻',
    '祁煜': '祁煜',
    '黎深': '黎深',
    '沈星回': '沈星回',
    '夏以昼': '夏以昼',
    '秦彻': '秦彻'
  };
  return mapping[role] || role;
};

export const getRoleAvatar = (role: string, mode: 'mbti' | 'game') => {
  if (mode === 'game') {
    switch (role) {
      case 'ENTJ': case '祁煜': return '/mbti/avatars/祁煜.jpg';
      case 'ISTJ': case '黎深': return '/mbti/avatars/黎深.jpg';
      case 'ENFP': case '沈星回': return '/mbti/avatars/沈星回.jpg';
      case 'INFP': case '夏以昼': return '/mbti/avatars/夏以昼.jpg';
      case 'ENFJ': case '秦彻': return '/mbti/avatars/秦彻.jpg';
      default: return null;
    }
  }
  return null;
};

export const gameRoleColors: Record<string, string> = {
  '沈星回': '#c084fc',
  '黎深': '#60a5fa',
  '秦彻': '#f87171',
  '祁煜': '#f472b6',
  '夏以昼': '#fb923c',
};

export const getRoleColor = (role: string, mode: 'mbti' | 'game') => {
  if (gameRoleColors[role]) return gameRoleColors[role];
  if (mode === 'game') return gameRoleColors[role] || '#94a3b8';
  const group = mbtiGroups.find(g => g.roles.includes(role as any));
  return group?.color || '#94a3b8';
};
