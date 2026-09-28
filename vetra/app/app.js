const $ = selector => document.querySelector(selector);
const processData = {
  Aéreo: { description: 'Solicitação a emissão de passagem.', steps: [['Solicitação','good'],['Validar dados','good'],['Aprovação',''],['Correção manual','issue'],['Emissão','good']], summary: [['602','casos analisados'],['68%','no caminho esperado'],['54h','esforço manual']] },
  Hotel: { description: 'Solicitação a confirmação de hospedagem.', steps: [['Solicitação','good'],['Conferir política','issue'],['Aprovação',''],['Reserva','good']], summary: [['402','casos analisados'],['74%','no caminho esperado'],['36h','esforço manual']] },
  Reembolso: { description: 'Prestação de contas a reembolso concluído.', steps: [['Solicitação','good'],['Comprovante ausente','issue'],['Análise',''],['Reembolso','good']], summary: [['200','casos analisados'],['61%','no caminho esperado'],['52h','esforço manual']] }
};
const deviationData = [
  ['Dados incompletos na solicitação','O fluxo retorna para correção antes da aprovação.','Aéreo','54h','high'],
  ['Reaprovação por mudança de rota','Uma alteração gera nova checagem de política e aprovação.','Aéreo','31h',''],
  ['Conferência de política manual','A regra não está configurada como validação do processo.','Hotel','22h',''],
  ['Comprovante enviado fora do padrão','A análise precisa interromper o fluxo para solicitar ajuste.','Reembolso','18h','']
];
function setView(view) {
  document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === view));
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const titles = { overview: 'Visão geral', processes: 'Processos', deviations: 'Desvios', opportunities: 'Oportunidades', simulation: 'Simulação' };
  $('#page-title').textContent = titles[view];
  $('#mobile-title').textContent = titles[view];
  document.body.classList.remove('drawer-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderProcess(name) {
  const data = processData[name];
  $('#process-title').textContent = name;
  $('#process-description').textContent = data.description;
  $('#process-timeline').innerHTML = data.steps.map(step => '<div class="' + step[1] + '">' + step[0] + '</div>').join('');
  $('#process-summary').innerHTML = data.summary.map(item => '<div><strong>' + item[0] + '</strong><span>' + item[1] + '</span></div>').join('');
}
function renderDeviations() {
  $('#deviation-list').innerHTML = deviationData.map((item, index) => '<article class="deviation ' + item[4] + '"><span>0' + (index + 1) + '</span><div><b>' + item[0] + '</b><p>' + item[1] + '</p></div><small>Processo: ' + item[2] + '</small><strong>' + item[3] + '</strong></article>').join('');
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('.process-tabs button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.process-tabs button').forEach(tab => tab.classList.toggle('active', tab === button));
  renderProcess(button.dataset.process);
}));
$('#simulation-switch').addEventListener('change', event => {
  const applied = event.target.checked;
  $('#manual-result').textContent = applied ? '88h' : '142h';
  $('#conformity-result').textContent = applied ? '81%' : '68%';
  $('#cycle-result').textContent = applied ? '1,8 dias' : '2,4 dias';
});
$('.menu-button').addEventListener('click', () => document.body.classList.add('drawer-open'));
$('.close-drawer').addEventListener('click', () => document.body.classList.remove('drawer-open'));
$('.overlay').addEventListener('click', () => document.body.classList.remove('drawer-open'));
renderProcess('Aéreo');
renderDeviations();
