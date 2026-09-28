const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const ANCHOR = new Date('2026-09-28T12:00:00');
const DAY = 86_400_000;
const processes = {
  'Aéreo': { code: 'AER', total: 600, expected: ['Solicitação', 'Validar dados', 'Aprovação', 'Emissão'] },
  'Hotel': { code: 'HOT', total: 400, expected: ['Solicitação', 'Conferir política', 'Aprovação', 'Reserva'] },
  'Reembolso': { code: 'REM', total: 200, expected: ['Solicitação', 'Validar comprovante', 'Análise', 'Reembolso'] }
};
const deviationCatalog = {
  data: { type: 'Dados incompletos', rootCause: 'Entrada de dados', causes: ['Documento ausente', 'Campo obrigatório vazio', 'Informação divergente'], severity: 'Média', stage: 'Validar dados', impact: 'Retrabalho e atraso', effort: [12, 28] },
  approval: { type: 'Aprovação atrasada', rootCause: 'Processo', causes: ['SLA sem alerta', 'Responsável indisponível', 'Alçada indefinida'], severity: 'Alta', stage: 'Aprovação', impact: 'Atraso na conclusão', effort: [11, 24] },
  fare: { type: 'Divergência de tarifa', rootCause: 'Fornecedor', causes: ['Tarifa fora da política', 'Condição não atualizada', 'Cotação expirou'], severity: 'Média', stage: 'Validação', impact: 'Nova cotação', effort: [10, 21] },
  policy: { type: 'Exceção de política', rootCause: 'Regra de negócio', causes: ['Rota excepcional', 'Centro de custo não previsto', 'Limite de diária'], severity: 'Alta', stage: 'Conferir política', impact: 'Aprovação adicional', effort: [13, 27] },
  receipt: { type: 'Comprovante ausente', rootCause: 'Entrada de dados', causes: ['Nota fiscal ausente', 'Arquivo ilegível', 'Anexo incorreto'], severity: 'Média', stage: 'Validar comprovante', impact: 'Solicitação de ajuste', effort: [14, 30] },
  integration: { type: 'Falha de integração', rootCause: 'Integração', causes: ['Sincronização interrompida', 'Cadastro não localizado', 'Retorno indisponível'], severity: 'Alta', stage: 'Análise', impact: 'Tratamento manual', effort: [16, 34] },
  abandonment: { type: 'Abandono de solicitação', rootCause: 'Usuário', causes: ['Solicitação não concluída', 'Informação não enviada', 'Mudança de necessidade'], severity: 'Baixa', stage: 'Solicitação', impact: 'Processo interrompido', effort: [4, 12] }
};
const variantDefinitions = {
  'Aéreo': [
    { id: 'expected', weight: 40, steps: ['Solicitação', 'Validar dados', 'Aprovação', 'Emissão'] },
    { id: 'data', weight: 24, deviation: 'data', steps: ['Solicitação', 'Validar dados', 'Correção manual', 'Validar dados', 'Aprovação', 'Emissão'] },
    { id: 'approval', weight: 16, deviation: 'approval', steps: ['Solicitação', 'Validar dados', 'Aprovação', 'Nova cobrança', 'Aprovação', 'Emissão'] },
    { id: 'fare', weight: 12, deviation: 'fare', steps: ['Solicitação', 'Validação', 'Nova cotação', 'Aprovação', 'Emissão'] },
    { id: 'abandonment', weight: 8, deviation: 'abandonment', steps: ['Solicitação', 'Abandono'] }
  ],
  'Hotel': [
    { id: 'expected', weight: 44, steps: ['Solicitação', 'Conferir política', 'Aprovação', 'Reserva'] },
    { id: 'policy', weight: 22, deviation: 'policy', steps: ['Solicitação', 'Conferir política', 'Aprovação adicional', 'Aprovação', 'Reserva'] },
    { id: 'data', weight: 15, deviation: 'data', steps: ['Solicitação', 'Validar dados', 'Correção manual', 'Conferir política', 'Aprovação', 'Reserva'] },
    { id: 'approval', weight: 11, deviation: 'approval', steps: ['Solicitação', 'Conferir política', 'Aprovação', 'Nova cobrança', 'Reserva'] },
    { id: 'abandonment', weight: 8, deviation: 'abandonment', steps: ['Solicitação', 'Abandono'] }
  ],
  'Reembolso': [
    { id: 'expected', weight: 35, steps: ['Solicitação', 'Validar comprovante', 'Análise', 'Reembolso'] },
    { id: 'receipt', weight: 25, deviation: 'receipt', steps: ['Solicitação', 'Validar comprovante', 'Solicitar comprovante', 'Correção manual', 'Análise', 'Reembolso'] },
    { id: 'data', weight: 15, deviation: 'data', steps: ['Solicitação', 'Validar comprovante', 'Correção manual', 'Análise', 'Reembolso'] },
    { id: 'integration', weight: 14, deviation: 'integration', steps: ['Solicitação', 'Validar comprovante', 'Análise', 'Tratamento manual', 'Reembolso'] },
    { id: 'abandonment', weight: 11, deviation: 'abandonment', steps: ['Solicitação', 'Abandono'] }
  ]
};
const opportunityTemplates = {
  data: { title: 'Validação de dados antes do envio', recommendation: 'AUTOMATIZAR', complexity: 1, potential: .56, rule: 'validate', proposedRule: 'Impedir o avanço quando campos obrigatórios ou documentos estiverem ausentes.' },
  receipt: { title: 'Conferência de comprovantes antes da análise', recommendation: 'AUTOMATIZAR', complexity: 1, potential: .54, rule: 'validate', proposedRule: 'Validar o anexo obrigatório antes de encaminhar a solicitação para análise.' },
  approval: { title: 'Alerta de SLA de aprovação', recommendation: 'AUTOMATIZAR PARCIALMENTE', complexity: 2, potential: .43, rule: 'sla', proposedRule: 'Alertar o responsável ao atingir 70% do SLA e escalar atrasos críticos.' },
  fare: { title: 'Validação de tarifa e política', recommendation: 'AUTOMATIZAR PARCIALMENTE', complexity: 2, potential: .31, rule: 'fare', proposedRule: 'Comparar tarifa e política antes da solicitação seguir para aprovação.' },
  policy: { title: 'Tratamento de exceções de política', recommendation: 'MANTER HUMANO', complexity: 3, potential: .18, rule: 'policy', proposedRule: 'Estruturar critérios e encaminhar exceções para decisão humana com contexto completo.' },
  integration: { title: 'Monitoramento de falhas de integração', recommendation: 'AUTOMATIZAR PARCIALMENTE', complexity: 3, potential: .32, rule: 'integration', proposedRule: 'Detectar retornos interrompidos e abrir uma tratativa antes da intervenção manual.' },
  abandonment: { title: 'Acompanhamento de solicitações incompletas', recommendation: 'MANTER HUMANO', complexity: 2, potential: .2, rule: 'followup', proposedRule: 'Notificar o solicitante e manter acompanhamento humano em casos sem resposta.' }
};
const simulationRules = [
  { id: 'validate', title: 'Validar campos obrigatórios', description: 'Reduz intervenções de dados incompletos e comprovantes ausentes; outras causas permanecem.', match: ['data', 'receipt'], reduction: .54, conformity: .55 },
  { id: 'sla', title: 'Alertar SLA em 70%', description: 'Reduz atrasos de aprovação ao alertar antes do prazo crítico.', match: ['approval'], reduction: .43, conformity: .42 },
  { id: 'fare', title: 'Validar tarifa antes da aprovação', description: 'Reduz parte das divergências de tarifa, mantendo exceções para análise.', match: ['fare'], reduction: .31, conformity: .28 },
  { id: 'policy', title: 'Escalonar exceções com contexto', description: 'Organiza exceções de política, mas mantém a decisão humana.', match: ['policy'], reduction: .18, conformity: .13 },
  { id: 'integration', title: 'Monitorar retornos de integração', description: 'Identifica falhas cedo e reduz parte do tratamento manual.', match: ['integration'], reduction: .32, conformity: .27 }
];
const state = { view: 'overview', process: 'all', period: '30', start: null, end: null, mapProcess: 'Aéreo', severity: 'all', deviationType: 'all', recurrence: 'all', opportunitySort: 'score', activeRules: new Set(['validate', 'sla']), selectedOpportunity: null };

function rng(seed) { let value = seed % 2147483647; return () => (value = value * 48271 % 2147483647) / 2147483647; }
function pick(list, random) { return list[Math.floor(random() * list.length)]; }
function weightedPick(list, random) { const total = list.reduce((sum, item) => sum + item.weight, 0); let point = random() * total; return list.find(item => (point -= item.weight) <= 0) || list[0]; }
function pad(value) { return String(value).padStart(2, '0'); }
function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
function formatHours(minutes) { const h = Math.floor(minutes / 60); const m = Math.round(minutes % 60); return `${h}h${pad(m)}`; }
function formatHoursShort(minutes) { return `${(minutes / 60).toFixed(1).replace('.', ',')}h`; }
function formatPercent(value) { return `${value.toFixed(1).replace('.', ',')}%`; }
function formatDate(date) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date); }
function info(label, text) { return `<button class="info-button" data-tooltip="${escapeHTML(text)}" aria-label="Explicar ${escapeHTML(label)}">i</button>`; }
function severityValue(severity) { return { Alta: 3, Média: 2, Baixa: 1 }[severity] || 1; }
function recurrenceLevel(count, total) { const rate = total ? count / total : 0; return rate >= .12 ? 'high' : rate >= .05 ? 'medium' : 'low'; }
function recurrenceLabel(level) { return ({ high: 'Alta', medium: 'Média', low: 'Baixa' })[level]; }

function createCase(type, index) {
  const random = rng((index + 1) * 971 + type.charCodeAt(0) * 41);
  const config = processes[type];
  const variant = weightedPick(variantDefinitions[type], random);
  const entry = new Date(ANCHOR.getTime() - (((index * 17 + Math.floor(random() * 11)) % 120) * DAY) - Math.floor(random() * 9) * 3_600_000);
  const deviation = variant.deviation ? deviationCatalog[variant.deviation] : null;
  const baseStepMinutes = type === 'Aéreo' ? 23 : type === 'Hotel' ? 31 : 43;
  const steps = [];
  let cursor = entry.getTime();
  variant.steps.forEach((name, stepIndex) => {
    const extra = deviation && (name.includes('manual') || name.includes('cobrança') || name.includes('cotação') || name.includes('comprovante') || name.includes('Tratamento') || name.includes('adicional')) ? 45 + Math.floor(random() * 85) : 0;
    cursor += (baseStepMinutes + Math.floor(random() * baseStepMinutes) + extra) * 60_000;
    steps.push({ name, at: new Date(cursor) });
    if (stepIndex === 0) cursor += Math.floor(random() * 8) * 60_000;
  });
  const manualMinutes = deviation ? deviation.effort[0] + Math.floor(random() * (deviation.effort[1] - deviation.effort[0] + 1)) : (random() < .08 ? 3 + Math.floor(random() * 8) : 0);
  const interventions = deviation ? 1 + (random() > .7 ? 1 : 0) : manualMinutes ? 1 : 0;
  const rootCauseDetail = deviation ? pick(deviation.causes, random) : null;
  const rework = Boolean(deviation && ['data', 'receipt', 'fare', 'policy'].includes(variant.deviation));
  const conclusion = steps.at(-1).at;
  return {
    id: `${config.code}-${pad(index + 1).padStart(4, '0')}`,
    type,
    entryDate: entry,
    conclusionDate: conclusion,
    steps,
    variantKey: `${type}:${variant.id}`,
    variantId: variant.id,
    expected: !deviation,
    manualInterventions: interventions,
    manualMinutes,
    deviationKey: variant.deviation || null,
    deviationType: deviation?.type || null,
    rootCause: deviation?.rootCause || null,
    rootCauseDetail,
    severity: deviation?.severity || null,
    deviationStage: deviation?.stage || null,
    impact: deviation?.impact || null,
    rework,
    status: variant.id === 'abandonment' ? 'Encerrado sem conclusão' : 'Concluído',
    responsible: pick(['Ana Souza', 'Bruno Lima', 'Camila Torres', 'Diego Rocha', 'Elisa Mendes', 'Rafael Costa'], random),
    handling: manualMinutes ? 'Manual assistido' : (random() > .45 ? 'Automatizado' : 'Manual'),
    improvementEligible: random() > .16
  };
}
function generateCases() { return Object.entries(processes).flatMap(([type, config]) => Array.from({ length: config.total }, (_, index) => createCase(type, index))); }
const cases = generateCases();

function filterCases() {
  let result = cases.filter(item => state.process === 'all' || item.type === state.process);
  if (state.period === 'custom') {
    if (state.start) result = result.filter(item => item.entryDate >= new Date(`${state.start}T00:00:00`));
    if (state.end) result = result.filter(item => item.entryDate <= new Date(`${state.end}T23:59:59`));
  } else {
    const start = new Date(ANCHOR.getTime() - Number(state.period) * DAY);
    result = result.filter(item => item.entryDate >= start && item.entryDate <= ANCHOR);
  }
  return result;
}
function calculateMetrics(items) {
  const total = items.length;
  const expected = items.filter(item => item.expected).length;
  const manualCases = items.filter(item => item.manualInterventions > 0).length;
  const interventions = items.reduce((sum, item) => sum + item.manualInterventions, 0);
  const rework = items.filter(item => item.rework).length;
  const deviations = items.filter(item => item.deviationKey).length;
  const manualMinutes = items.reduce((sum, item) => sum + item.manualMinutes, 0);
  const cycleMinutes = items.reduce((sum, item) => sum + (item.conclusionDate - item.entryDate) / 60_000, 0);
  return { total, expected, manualCases, interventions, rework, deviations, manualMinutes, cycleMinutes, conformity: total ? expected / total * 100 : 0, interventionRate: total ? manualCases / total * 100 : 0, reworkRate: total ? rework / total * 100 : 0, avgCycle: total ? cycleMinutes / total : 0 };
}
function deviationRows(items) {
  const groups = new Map();
  items.filter(item => item.deviationKey).forEach(item => {
    const key = `${item.type}|${item.deviationKey}`;
    if (!groups.has(key)) groups.set(key, { key, type: item.type, deviationKey: item.deviationKey, deviationType: item.deviationType, severity: item.severity, stage: item.deviationStage, impact: item.impact, cases: [] });
    groups.get(key).cases.push(item);
  });
  return [...groups.values()].map(group => {
    const minutes = group.cases.reduce((sum, item) => sum + item.manualMinutes, 0);
    const causes = Object.entries(group.cases.reduce((map, item) => { map[item.rootCauseDetail] = (map[item.rootCauseDetail] || 0) + 1; return map; }, {})).sort((a, b) => b[1] - a[1]);
    return { ...group, count: group.cases.length, minutes, causes, recurrence: recurrenceLevel(group.cases.length, items.length) };
  });
}
function causeRows(items) {
  const groups = new Map();
  items.filter(item => item.rootCause).forEach(item => {
    if (!groups.has(item.rootCause)) groups.set(item.rootCause, []);
    groups.get(item.rootCause).push(item);
  });
  return [...groups.entries()].map(([cause, groupedCases]) => ({ cause, cases: groupedCases, count: groupedCases.length, minutes: groupedCases.reduce((sum, item) => sum + item.manualMinutes, 0), impact: groupedCases.reduce((sum, item) => sum + severityValue(item.severity), 0), types: [...new Set(groupedCases.map(item => item.deviationType))] })).sort((a, b) => b.minutes - a.minutes);
}
function variantRows(items, type) {
  const subset = items.filter(item => item.type === type);
  const groups = new Map();
  subset.forEach(item => { if (!groups.has(item.variantKey)) groups.set(item.variantKey, []); groups.get(item.variantKey).push(item); });
  return [...groups.entries()].map(([key, groupedCases]) => ({ key, id: groupedCases[0].variantId, steps: groupedCases[0].steps.map(step => step.name), cases: groupedCases, count: groupedCases.length, percentage: subset.length ? groupedCases.length / subset.length * 100 : 0, avgCycle: groupedCases.reduce((sum, item) => sum + (item.conclusionDate - item.entryDate) / 60_000, 0) / groupedCases.length, minutes: groupedCases.reduce((sum, item) => sum + item.manualMinutes, 0), deviations: groupedCases.filter(item => item.deviationKey).length })).sort((a, b) => b.count - a.count);
}
function opportunities(items) {
  const metrics = calculateMetrics(items);
  return deviationRows(items).map(row => {
    const template = opportunityTemplates[row.deviationKey];
    const recurrence = Math.min(35, Math.round(row.count / Math.max(metrics.total, 1) * 220));
    const effort = Math.min(30, Math.round(row.minutes / Math.max(metrics.manualMinutes, 1) * 30));
    const impact = severityValue(row.severity) === 3 ? 25 : severityValue(row.severity) === 2 ? 17 : 9;
    const complexity = template.complexity * 5;
    const score = Math.max(0, Math.min(100, recurrence + effort + impact - complexity));
    return { ...row, ...template, recurrenceScore: recurrence, effortScore: effort, impactScore: impact, complexityPenalty: complexity, score, key: `op:${row.key}`, potentialCases: Math.round(row.count * template.potential) };
  });
}
function getProcessForMap() { return state.process === 'all' ? state.mapProcess : state.process; }
function getFilteredDeviations(items) {
  return deviationRows(items).filter(row => (state.severity === 'all' || row.severity === state.severity) && (state.deviationType === 'all' || row.deviationKey === state.deviationType) && (state.recurrence === 'all' || row.recurrence === state.recurrence));
}
function renderMetric(label, value, detail, tooltip, accent = false) { return `<article class="metric-card ${accent ? 'acid' : ''}"><div class="metric-label"><span>${label}</span>${info(label, tooltip)}</div><strong>${value}</strong><small>${detail}</small></article>`; }

function renderOverview(items) {
  const metric = calculateMetrics(items);
  const relatedOpportunities = opportunities(items);
  $('#overview-metrics').innerHTML = [
    renderMetric('Total de casos', metric.total.toLocaleString('pt-BR'), 'casos no período', 'Quantidade de casos cuja data de entrada está dentro do filtro atual.'),
    renderMetric('Conformidade', formatPercent(metric.conformity), 'seguiram o fluxo esperado', 'Percentual de casos que concluíram sem desviar do caminho esperado.', true),
    renderMetric('Intervenção manual', formatPercent(metric.interventionRate), 'casos com atuação humana', 'Percentual de casos que exigiram ao menos uma intervenção manual.'),
    renderMetric('Esforço manual', formatHours(metric.manualMinutes), 'tempo total de intervenção', 'Soma dos minutos registrados em intervenções manuais.'),
    renderMetric('Retrabalho', formatPercent(metric.reworkRate), 'casos com retorno de etapa', 'Percentual de casos que precisaram retornar a uma etapa anterior.'),
    renderMetric('Tempo médio', formatHoursShort(metric.avgCycle), 'entre entrada e conclusão', 'Média do tempo decorrido entre a entrada e a conclusão de cada caso.'),
    renderMetric('Desvios', metric.deviations.toLocaleString('pt-BR'), 'casos fora do fluxo', 'Quantidade de casos que tiveram ao menos um desvio registrado.'),
    renderMetric('Oportunidades', relatedOpportunities.length.toLocaleString('pt-BR'), 'problemas priorizáveis', 'Desvios recorrentes que geraram uma oportunidade de melhoria.'),
  ].join('');
  const attention = deviationRows(items).sort((a, b) => b.minutes - a.minutes).slice(0, 3);
  $('#attention-list').innerHTML = attention.length ? attention.map((row, index) => `<button class="attention-item" data-open-deviation="${row.key}"><span class="attention-index">0${index + 1}</span><span><b>${escapeHTML(row.deviationType)}</b><p>${row.count} ocorrências · ${formatHours(row.minutes)} de esforço manual</p></span><strong>${formatHoursShort(row.minutes)}</strong></button>`).join('') : emptyState('Não há desvios no período selecionado.');
  const healthTypes = state.process === 'all' ? Object.keys(processes) : [state.process];
  $('#health-bars').innerHTML = healthTypes.map(type => { const data = calculateMetrics(items.filter(item => item.type === type)); return barRow(type, data.conformity, formatPercent(data.conformity)); }).join('');
  const causes = causeRows(items).slice(0, 4);
  $('#cause-bars').innerHTML = causes.length ? causes.map(row => barRow(row.cause, metric.manualMinutes ? row.minutes / metric.manualMinutes * 100 : 0, formatHours(row.minutes))).join('') : emptyState('Sem esforço manual no período.');
  const top = [...relatedOpportunities].sort((a, b) => b.score - a.score)[0];
  $('#top-opportunity').innerHTML = top ? `<span class="decision-type">${top.recommendation}</span><h3>${escapeHTML(top.title)}</h3><p>${top.count} casos · ${formatHours(top.minutes)} de esforço manual · score ${top.score}/100</p><button data-open-opportunity="${top.key}">Investigar oportunidade</button>` : emptyState('Sem oportunidades para os filtros atuais.');
}
function barRow(label, percent, value) { return `<div class="bar-row"><span>${escapeHTML(label)}</span><div class="bar-track"><div class="bar-value" style="width:${Math.max(2, Math.min(100, percent))}%"></div></div><strong>${value}</strong></div>`; }
function emptyState(text) { return `<p class="empty-state">${escapeHTML(text)}</p>`; }

function renderProcesses(items) {
  const type = getProcessForMap();
  const select = $('#map-process-filter');
  select.value = type;
  select.disabled = state.process !== 'all';
  const subset = items.filter(item => item.type === type);
  $('#expected-title').textContent = type;
  $('#expected-flow').innerHTML = processFlow(processes[type].expected, 'expected', type, subset);
  const variants = variantRows(items, type);
  $('#variant-map').innerHTML = variants.slice(0, 4).map((variant, index) => `<article class="variant-card"><div class="variant-card-top"><b>Variante ${index + 1} · ${variant.count} casos (${formatPercent(variant.percentage)})</b><span>${formatHoursShort(variant.avgCycle)} em média · ${formatHours(variant.minutes)} manual</span></div><div class="variant-flow">${processFlow(variant.steps, variant.id === 'expected' ? 'expected' : 'real', type, subset, variant.key)}</div><div class="variant-stats"><span><strong>${variant.deviations}</strong> desvios</span><span><strong>${variant.count}</strong> casos</span><button class="text-button" data-open-variant="${variant.key}">Ver casos</button></div></article>`).join('') || emptyState('Não há casos deste processo no período selecionado.');
  $('#variants-table').innerHTML = variants.map(variant => `<tr data-open-variant="${variant.key}"><td class="path-cell">${escapeHTML(variant.steps.join(' → '))}</td><td>${variant.count}</td><td>${formatPercent(variant.percentage)}</td><td>${formatHoursShort(variant.avgCycle)}</td><td>${formatHours(variant.minutes)}</td><td>${variant.deviations}</td></tr>`).join('') || `<tr><td colspan="6">Nenhuma variante encontrada.</td></tr>`;
}
function processFlow(steps, flavor, type, subset, variantKey = null) {
  return steps.map((step, index) => `${index ? '<i class="flow-arrow"></i>' : ''}<button class="step-button ${flavor === 'expected' ? 'expected' : (['Correção manual', 'Nova cobrança', 'Nova cotação', 'Solicitar comprovante', 'Tratamento manual', 'Abandono', 'Aprovação adicional'].includes(step) ? 'issue' : '')}" data-open-step="${escapeHTML(step)}" data-step-process="${type}" data-step-variant="${variantKey || ''}">${escapeHTML(step)}</button>`).join('');
}

function renderDeviations(items) {
  const allRows = deviationRows(items);
  const typeSelect = $('#deviation-type-filter');
  const selected = state.deviationType;
  typeSelect.innerHTML = `<option value="all">Todos os tipos</option>${[...new Set(allRows.map(row => row.deviationKey))].map(key => `<option value="${key}">${escapeHTML(deviationCatalog[key].type)}</option>`).join('')}`;
  typeSelect.value = [...typeSelect.options].some(option => option.value === selected) ? selected : 'all';
  if (typeSelect.value === 'all') state.deviationType = 'all';
  const rows = getFilteredDeviations(items);
  $('#deviations-table').innerHTML = rows.map(row => `<tr data-open-deviation="${row.key}"><td>${escapeHTML(row.deviationType)}</td><td>${row.type}</td><td>${row.count}</td><td>${formatHours(row.minutes)}</td><td>${escapeHTML(row.impact)}</td><td><span class="pill ${row.severity === 'Alta' ? 'high' : row.severity === 'Média' ? 'medium' : 'low'}">${row.severity}</span></td><td>${escapeHTML(row.stage)}</td></tr>`).join('') || `<tr><td colspan="7">Nenhum desvio atende aos filtros selecionados.</td></tr>`;
}
function renderCauses(items) {
  $('#cause-grid').innerHTML = causeRows(items).map(row => `<article class="panel cause-card"><span class="cause-category">${escapeHTML(row.cause)}</span><h3>${escapeHTML(row.types.slice(0, 2).join(' · '))}${row.types.length > 2 ? ' +' : ''}</h3><div class="cause-measures"><div><span>Ocorrências</span><strong>${row.count}</strong></div><div><span>Tempo manual</span><strong>${formatHours(row.minutes)}</strong></div><div><span>Impacto</span><strong>${row.impact}</strong></div></div><button data-open-cause="${escapeHTML(row.cause)}">Investigar causa</button></article>`).join('') || emptyState('Nenhuma causa raiz registrada no período.');
}
function renderOpportunities(items) {
  const rows = opportunities(items);
  const sorters = { score: (a, b) => b.score - a.score, impact: (a, b) => b.impactScore - a.impactScore, effort: (a, b) => b.minutes - a.minutes, recurrence: (a, b) => b.count - a.count, automation: (a, b) => b.potential - a.potential };
  rows.sort(sorters[state.opportunitySort]);
  $('#opportunity-grid').innerHTML = rows.map(row => `<article class="opportunity-card ${row.recommendation === 'AUTOMATIZAR PARCIALMENTE' ? 'partial' : row.recommendation === 'MANTER HUMANO' ? 'human' : ''} ${state.selectedOpportunity === row.key ? 'selected' : ''}"><div class="opportunity-top"><span class="opportunity-type">${row.recommendation}</span><span class="opportunity-score">${row.score}</span></div><h3>${escapeHTML(row.title)}</h3><p>Origem: ${row.count} casos com ${row.deviationType.toLocaleLowerCase('pt-BR')}.</p><div class="opportunity-meta"><span>Impacto<strong>${formatHours(row.minutes)} manual</strong></span><span>Recorrência<strong>${recurrenceLabel(row.recurrence)}</strong></span><span>Complexidade<strong>${['Baixa', 'Média', 'Alta'][row.complexity - 1]}</strong></span><span>Potencial<strong>${row.potentialCases} casos</strong></span></div><button data-open-opportunity="${row.key}">Ver decisão</button></article>`).join('') || emptyState('Nenhuma oportunidade identificada no período.');
}
function renderSimulation(items) {
  $('#simulation-rules').innerHTML = simulationRules.map(rule => `<label class="rule-toggle"><input type="checkbox" data-rule="${rule.id}" ${state.activeRules.has(rule.id) ? 'checked' : ''}><span><strong>${rule.title}</strong><small>${rule.description}</small></span></label>`).join('');
  const selected = simulationRules.filter(rule => state.activeRules.has(rule.id));
  $('#simulation-rule-copy').textContent = selected.length ? selected.map(rule => rule.description).join(' ') : 'Nenhuma regra ativa: o cenário simulado permanece igual ao cenário atual.';
  const current = calculateMetrics(items);
  const simulated = simulate(items, selected);
  $('#current-scenario').innerHTML = scenarioMetrics(current, false);
  $('#simulated-scenario').innerHTML = scenarioMetrics(simulated, false);
  $('#scenario-impact').innerHTML = `<div class="scenario-metrics"><div><span>Intervenções</span><strong>${signed(current.interventions - simulated.interventions)}</strong></div><div><span>Esforço manual</span><strong>${signedMinutes(current.manualMinutes - simulated.manualMinutes)}</strong></div><div><span>Conformidade</span><strong>${signedPercent(simulated.conformity - current.conformity)}</strong></div><div><span>Tempo médio</span><strong>${signedMinutes(current.avgCycle - simulated.avgCycle)}</strong></div></div>`;
}
function scenarioMetrics(metric) { return `<div class="scenario-metrics"><div><span>Casos</span><strong>${metric.total}</strong></div><div><span>Intervenções manuais</span><strong>${Math.round(metric.interventions)}</strong></div><div><span>Esforço manual</span><strong>${formatHours(Math.round(metric.manualMinutes))}</strong></div><div><span>Conformidade</span><strong>${formatPercent(metric.conformity)}</strong></div><div><span>Tempo médio</span><strong>${formatHoursShort(metric.avgCycle)}</strong></div></div>`; }
function signed(value) { return `${value >= 0 ? '-' : '+'}${Math.abs(Math.round(value))}`; }
function signedMinutes(value) { return `${value >= 0 ? '-' : '+'}${formatHours(Math.abs(Math.round(value)))}`; }
function signedPercent(value) { return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1).replace('.', ',')} p.p.`; }
function simulate(items, selectedRules) {
  const base = calculateMetrics(items);
  let manualMinutes = 0, interventions = 0, improvedExpected = 0, cycleReduction = 0;
  items.forEach(item => {
    const matching = selectedRules.filter(rule => item.deviationKey && rule.match.includes(item.deviationKey));
    const reduction = matching.length ? Math.max(...matching.map(rule => rule.reduction)) : 0;
    const conformityReduction = matching.length ? Math.max(...matching.map(rule => rule.conformity)) : 0;
    const minutes = item.manualMinutes * (1 - reduction);
    manualMinutes += minutes;
    interventions += item.manualInterventions * (1 - reduction);
    if (item.deviationKey && item.improvementEligible && conformityReduction && (item.id.charCodeAt(4) + item.id.charCodeAt(5)) % 100 < conformityReduction * 100) improvedExpected += 1;
    cycleReduction += item.manualMinutes * reduction * .55;
  });
  return { ...base, manualMinutes, interventions, expected: Math.min(base.total, base.expected + improvedExpected), conformity: base.total ? Math.min(100, (base.expected + improvedExpected) / base.total * 100) : 0, avgCycle: Math.max(0, base.avgCycle - cycleReduction / Math.max(1, base.total)) };
}

function openDrawer(kicker, content) { $('#drawer-kicker').textContent = kicker; $('#drawer-content').innerHTML = content; $('#detail-drawer').classList.add('open'); $('#detail-overlay').classList.add('open'); $('#detail-drawer').setAttribute('aria-hidden', 'false'); $('#close-detail').focus(); }
function closeDrawer() { $('#detail-drawer').classList.remove('open'); $('#detail-overlay').classList.remove('open'); $('#detail-drawer').setAttribute('aria-hidden', 'true'); }
function caseRows(items) { return `<div class="detail-list">${items.slice(0, 14).map(item => `<button class="case-row" data-open-case="${item.id}"><span><b>${item.id}</b><span>${item.type} · ${item.status}</span></span><strong>${formatHours(item.manualMinutes)}</strong></button>`).join('')}</div>${items.length > 14 ? `<p class="drawer-muted">Exibindo 14 de ${items.length} casos encontrados.</p>` : ''}`; }
function openStep(type, step, variantKey) {
  const items = filterCases().filter(item => item.type === type && item.steps.some(event => event.name === step) && (!variantKey || item.variantKey === variantKey));
  const stageTimes = items.map(item => { const index = item.steps.findIndex(event => event.name === step); return index >= 0 && item.steps[index + 1] ? (item.steps[index + 1].at - item.steps[index].at) / 60_000 : 0; });
  const average = stageTimes.reduce((sum, value) => sum + value, 0) / Math.max(1, stageTimes.filter(Boolean).length);
  const manual = items.filter(item => item.manualInterventions).length;
  const totalMinutes = items.reduce((sum, item) => sum + item.manualMinutes, 0);
  const causes = causeRows(items).slice(0, 3);
  openDrawer('Etapa do processo', `<h2 class="detail-title">${escapeHTML(step)}</h2><p class="detail-subtitle">${type} · leitura baseada nos casos filtrados</p><div class="detail-stats"><div><span>Casos</span><strong>${items.length}</strong></div><div><span>Tempo médio</span><strong>${formatHoursShort(average)}</strong></div><div><span>Intervenções</span><strong>${manual}</strong></div><div><span>Impacto manual</span><strong>${formatHours(totalMinutes)}</strong></div></div><section class="detail-section"><h3>Principais causas</h3><ul>${causes.map(row => `<li>${escapeHTML(row.cause)}: ${row.count} ocorrências</li>`).join('') || '<li>Sem causa raiz associada</li>'}</ul></section><section class="detail-section"><h3>Casos que passaram pela etapa</h3>${caseRows(items)}</section>`);
}
function openVariant(key) {
  const items = filterCases().filter(item => item.variantKey === key);
  const metrics = calculateMetrics(items);
  const steps = items[0]?.steps.map(event => event.name) || [];
  openDrawer('Variante do processo', `<h2 class="detail-title">${escapeHTML(steps.join(' → '))}</h2><p class="detail-subtitle">Todos os casos abaixo percorreram esta mesma variante.</p><div class="detail-stats"><div><span>Casos</span><strong>${metrics.total}</strong></div><div><span>Conformidade</span><strong>${formatPercent(metrics.conformity)}</strong></div><div><span>Tempo médio</span><strong>${formatHoursShort(metrics.avgCycle)}</strong></div><div><span>Esforço manual</span><strong>${formatHours(metrics.manualMinutes)}</strong></div></div><section class="detail-section"><h3>Casos encontrados</h3>${caseRows(items)}</section>`);
}
function openDeviation(key) {
  const row = deviationRows(filterCases()).find(item => item.key === key);
  if (!row) return;
  const causeList = row.causes.slice(0, 3).map(([cause, count]) => `<li>${escapeHTML(cause)}: ${count}</li>`).join('');
  const percent = row.cases.length / Math.max(1, filterCases().length) * 100;
  const related = opportunities(filterCases()).find(item => item.deviationKey === row.deviationKey && item.type === row.type);
  openDrawer('Desvio investigado', `<h2 class="detail-title">${escapeHTML(row.deviationType)}</h2><p class="detail-subtitle">${row.type} · ${row.stage} · criticidade ${row.severity}</p><div class="detail-stats"><div><span>Ocorrências</span><strong>${row.count}</strong></div><div><span>Esforço manual</span><strong>${formatHours(row.minutes)}</strong></div><div><span>Casos analisados</span><strong>${formatPercent(percent)}</strong></div><div><span>Recorrência</span><strong>${recurrenceLabel(row.recurrence)}</strong></div></div><section class="detail-section"><h3>Onde acontece</h3><p>${escapeHTML(row.stage)} · ${escapeHTML(row.impact)}</p></section><section class="detail-section"><h3>Principais causas</h3><ul>${causeList}</ul></section>${related ? `<button class="detail-action" data-open-opportunity="${related.key}">Ver oportunidade relacionada</button>` : ''}<section class="detail-section"><h3>Casos relacionados</h3>${caseRows(row.cases)}</section>`);
}
function openCause(cause) {
  const row = causeRows(filterCases()).find(item => item.cause === cause);
  if (!row) return;
  openDrawer('Causa raiz', `<h2 class="detail-title">${escapeHTML(row.cause)}</h2><p class="detail-subtitle">Classificação de causa raiz agregada pela VETRA.</p><div class="detail-stats"><div><span>Ocorrências</span><strong>${row.count}</strong></div><div><span>Tempo manual</span><strong>${formatHours(row.minutes)}</strong></div><div><span>Impacto</span><strong>${row.impact}</strong></div></div><section class="detail-section"><h3>Desvios associados</h3><ul>${row.types.map(type => `<li>${escapeHTML(type)}</li>`).join('')}</ul></section><section class="detail-section"><h3>Casos relacionados</h3>${caseRows(row.cases)}</section>`);
}
function openOpportunity(key) {
  const row = opportunities(filterCases()).find(item => item.key === key);
  if (!row) return;
  state.selectedOpportunity = key;
  const category = deviationCatalog[row.deviationKey];
  openDrawer('Decisão de melhoria', `<h2 class="detail-title">${escapeHTML(row.title)}</h2><p class="detail-subtitle">Score ${row.score}/100 · ${row.recommendation}</p><div class="detail-stats"><div><span>Origem</span><strong>${row.count} casos</strong></div><div><span>Impacto</span><strong>${formatHours(row.minutes)}</strong></div><div><span>Recorrência</span><strong>${recurrenceLabel(row.recurrence)}</strong></div><div><span>Complexidade</span><strong>${['Baixa', 'Média', 'Alta'][row.complexity - 1]}</strong></div></div><section class="detail-section"><h3>Problema atual</h3><p>${row.count} casos apresentam ${row.deviationType.toLocaleLowerCase('pt-BR')} no processo ${row.type}.</p></section><section class="detail-section"><h3>Causa</h3><p>${escapeHTML(category.rootCause)}: ${escapeHTML(row.causes[0]?.[0] || 'causa a investigar')}.</p></section><section class="detail-section"><h3>Impacto</h3><p>${formatHours(row.minutes)} de esforço manual e ${row.count} ocorrências no período filtrado.</p></section><section class="detail-section"><h3>Regra proposta</h3><p>${escapeHTML(row.proposedRule)}</p></section><section class="detail-section"><h3>Resultado esperado</h3><p>Até ${row.potentialCases} de ${row.count} casos identificados na base poderiam evitar parte do desvio. A estimativa não presume eliminação total.</p></section><button class="detail-action" data-simulate-rule="${row.rule}">Simular esta melhoria</button>`);
}
function openCase(id) {
  const item = cases.find(caseItem => caseItem.id === id);
  if (!item) return;
  openDrawer('Caso individual', `<h2 class="detail-title">${item.id}</h2><p class="detail-subtitle">${item.type} · ${item.status} · responsável: ${item.responsible}</p><div class="detail-stats"><div><span>Tempo total</span><strong>${formatHours((item.conclusionDate - item.entryDate) / 60_000)}</strong></div><div><span>Tempo manual</span><strong>${formatHours(item.manualMinutes)}</strong></div><div><span>Desvio</span><strong>${item.deviationType || 'Nenhum'}</strong></div><div><span>Tratamento</span><strong>${item.handling}</strong></div></div><section class="detail-section"><h3>Linha do tempo</h3><div class="case-timeline">${item.steps.map(event => `<div class="timeline-event"><time>${pad(event.at.getHours())}:${pad(event.at.getMinutes())}</time><div>${escapeHTML(event.name)}</div></div>`).join('')}</div></section>${item.deviationType ? `<section class="detail-section"><h3>Detalhe do desvio</h3><p>${item.deviationType} · ${item.rootCauseDetail} · ${item.severity}</p></section>` : ''}`);
}

function updateFilterSummary(items) {
  const periodText = state.period === 'custom' ? `${state.start ? formatDate(new Date(`${state.start}T12:00:00`)) : 'início'} a ${state.end ? formatDate(new Date(`${state.end}T12:00:00`)) : 'hoje'}` : `últimos ${state.period} dias`;
  $('#filter-summary').textContent = `${items.length.toLocaleString('pt-BR')} casos · ${state.process === 'all' ? 'todos os processos' : state.process} · ${periodText}`;
}
function renderAll() {
  const items = filterCases();
  updateFilterSummary(items);
  renderOverview(items);
  renderProcesses(items);
  renderDeviations(items);
  renderCauses(items);
  renderOpportunities(items);
  renderSimulation(items);
}
function setView(view) {
  state.view = view;
  const titles = { overview: 'Visão geral', processes: 'Processos', deviations: 'Desvios', causes: 'Causas raiz', opportunities: 'Oportunidades', simulation: 'Simulação', about: 'Sobre a VETRA' };
  $$('.view').forEach(section => section.classList.toggle('active', section.id === view));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('#page-title').textContent = titles[view]; $('#mobile-title').textContent = titles[view];
  closeDrawer();
  document.body.classList.remove('drawer-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAll();
}
function initFilters() {
  const defaultStart = new Date(ANCHOR.getTime() - 30 * DAY).toISOString().slice(0, 10);
  const defaultEnd = ANCHOR.toISOString().slice(0, 10);
  $('#start-date').value = defaultStart; $('#end-date').value = defaultEnd; state.start = defaultStart; state.end = defaultEnd;
  $('#process-filter').addEventListener('change', event => { state.process = event.target.value; if (state.process !== 'all') state.mapProcess = state.process; renderAll(); });
  $('#period-filter').addEventListener('change', event => { state.period = event.target.value; $('#custom-range').hidden = state.period !== 'custom'; renderAll(); });
  ['start-date', 'end-date'].forEach(id => $("#" + id).addEventListener('change', event => { state[id === 'start-date' ? 'start' : 'end'] = event.target.value; renderAll(); }));
  $('#map-process-filter').addEventListener('change', event => { state.mapProcess = event.target.value; renderProcesses(filterCases()); });
  $('#severity-filter').addEventListener('change', event => { state.severity = event.target.value; renderDeviations(filterCases()); });
  $('#deviation-type-filter').addEventListener('change', event => { state.deviationType = event.target.value; renderDeviations(filterCases()); });
  $('#recurrence-filter').addEventListener('change', event => { state.recurrence = event.target.value; renderDeviations(filterCases()); });
  $('#opportunity-sort').addEventListener('change', event => { state.opportunitySort = event.target.value; renderOpportunities(filterCases()); });
}
function showTooltip(button) {
  const tooltip = $('#tooltip'); const text = button.dataset.tooltip; if (!text) return;
  tooltip.textContent = text; tooltip.hidden = false;
  const rect = button.getBoundingClientRect();
  const width = Math.min(260, window.innerWidth - 24); tooltip.style.width = `${width}px`;
  const box = tooltip.getBoundingClientRect();
  let top = rect.bottom + 9; if (top + box.height > window.innerHeight - 10) top = rect.top - box.height - 9;
  let left = rect.left + rect.width / 2 - box.width / 2; left = Math.max(12, Math.min(left, window.innerWidth - box.width - 12));
  tooltip.style.top = `${Math.max(10, top)}px`; tooltip.style.left = `${left}px`;
}
function hideTooltip() { $('#tooltip').hidden = true; }
let pinnedTooltipButton = null;
function bindInteractions() {
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-view],[data-open-step],[data-open-variant],[data-open-deviation],[data-open-cause],[data-open-opportunity],[data-open-case],[data-simulate-rule],[data-rule],.info-button');
    if (!action) { if (!event.target.closest('#tooltip')) { pinnedTooltipButton = null; hideTooltip(); } return; }
    if (action.matches('.info-button')) { event.stopPropagation(); if (pinnedTooltipButton === action) { pinnedTooltipButton = null; hideTooltip(); } else { pinnedTooltipButton = action; showTooltip(action); } return; }
    if (action.dataset.view) { setView(action.dataset.view); return; }
    if (action.dataset.openStep) { openStep(action.dataset.stepProcess, action.dataset.openStep, action.dataset.stepVariant); return; }
    if (action.dataset.openVariant) { openVariant(action.dataset.openVariant); return; }
    if (action.dataset.openDeviation) { openDeviation(action.dataset.openDeviation); return; }
    if (action.dataset.openCause) { openCause(action.dataset.openCause); return; }
    if (action.dataset.openOpportunity) { openOpportunity(action.dataset.openOpportunity); return; }
    if (action.dataset.openCase) { openCase(action.dataset.openCase); return; }
    if (action.dataset.simulateRule) { state.activeRules.add(action.dataset.simulateRule); closeDrawer(); setView('simulation'); return; }
    if (action.dataset.rule) { state.activeRules[action.checked ? 'add' : 'delete'](action.dataset.rule); renderSimulation(filterCases()); }
  });
  document.addEventListener('pointerover', event => { const button = event.target.closest('.info-button'); if (button && !pinnedTooltipButton && window.matchMedia('(hover:hover)').matches) showTooltip(button); });
  document.addEventListener('pointerout', event => { if (event.target.closest('.info-button') && !pinnedTooltipButton && window.matchMedia('(hover:hover)').matches) hideTooltip(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { pinnedTooltipButton = null; hideTooltip(); closeDrawer(); } });
  $('#close-detail').addEventListener('click', closeDrawer); $('#detail-overlay').addEventListener('click', closeDrawer);
  $('.menu-button').addEventListener('click', () => document.body.classList.add('drawer-open')); $('.close-drawer').addEventListener('click', () => document.body.classList.remove('drawer-open')); $('.overlay').addEventListener('click', () => document.body.classList.remove('drawer-open'));
}
initFilters(); bindInteractions(); renderAll();
