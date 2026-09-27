const storageKey = 'orvia-workspace-v1';
const welcomeKey = 'orvia-welcome-v1';
const stages = ['Novo', 'Contato', 'Qualificado', 'Proposta', 'Negociação', 'Ganho'];
const sellers = ['Júlia', 'Camila', 'Rafael'];
const origins = ['Instagram', 'Google', 'Indicação', 'Prospecção', 'WhatsApp', 'Site', 'Evento'];
const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const plain = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const seed = [
  ['Mariana Costa','Aurora Arquitetura','Júlia','Sistema de Gestão','Indicação','Negociação',4500,'2026-09-18'],['Gustavo Lima','Norte Solar','Camila','CRM Comercial','Google','Proposta',6800,'2026-09-15'],['Renata Alves','Ateliê Nuvem','Júlia','Portal do Cliente','Instagram','Contato',3200,'2026-09-14'],['Caio Mendes','Métrica Contábil','Rafael','Automação Financeira','Prospecção','Qualificado',5400,'2026-09-12'],['Patrícia Rocha','Casa Aroeira','Camila','Sistema de Gestão','WhatsApp','Novo',2400,'2026-09-11'],['Diego Santos','Elo Transportes','Rafael','Sistema de Gestão','Evento','Ganho',8900,'2026-09-09'],['Carla Freitas','Viva Odonto','Júlia','CRM Comercial','Site','Ganho',4200,'2026-09-08'],['Felipe Nunes','Brisa Foods','Camila','Automação Financeira','Google','Negociação',7200,'2026-09-06'],['Lívia Amaral','Estúdio Círculo','Júlia','Portal do Cliente','Instagram','Proposta',3900,'2026-09-04'],['Bruno Reis','Ação Log','Rafael','Sistema de Gestão','Indicação','Contato',6100,'2026-08-28'],['Ana Beatriz','Nexo Escola','Camila','CRM Comercial','WhatsApp','Qualificado',2800,'2026-08-25'],['Rafael Duarte','Plano Verde','Rafael','Automação Financeira','Prospecção','Perdido',5000,'2026-08-23'],['Juliana Melo','Café Duna','Júlia','CRM Comercial','Evento','Ganho',3600,'2026-08-19'],['Henrique Vilela','Axis Engenharia','Camila','Sistema de Gestão','Google','Novo',7900,'2026-08-17'],['Tainá Luz','Lumi Casa','Júlia','Portal do Cliente','Instagram','Contato',3300,'2026-08-14'],['Marcelo Vieira','Ponto Farma','Rafael','CRM Comercial','Indicação','Proposta',5800,'2026-08-10'],['Sofia Marques','Arco Legal','Camila','Sistema de Gestão','Site','Negociação',4400,'2026-08-08'],['Eduardo Silva','Terra Alta','Rafael','Automação Financeira','Google','Ganho',9700,'2026-08-04'],['Camila Azevedo','Nina Decor','Júlia','Sistema de Gestão','WhatsApp','Novo',3100,'2026-07-29'],['João Pedro','Giro Eventos','Camila','CRM Comercial','Evento','Perdido',4000,'2026-07-23'],['Natália Prado','Ciclo Tech','Rafael','Portal do Cliente','Prospecção','Qualificado',6500,'2026-07-18'],['Vitor Ramos','Ativa Saúde','Júlia','Automação Financeira','Indicação','Ganho',5600,'2026-07-11']
].map((entry, id) => Object.fromEntries(['name','company','seller','product','origin','stage','value','date'].map((key, index) => [key, entry[index]]).concat([['id', id]])));

let leads = JSON.parse(localStorage.getItem(storageKey) || 'null') || seed;
const $ = selector => document.querySelector(selector);

function calc() {
  const won = leads.filter(lead => lead.stage === 'Ganho');
  const open = leads.filter(lead => !['Ganho', 'Perdido'].includes(lead.stage));
  const active = leads.filter(lead => lead.stage !== 'Perdido');
  const revenue = won.reduce((sum, lead) => sum + Number(lead.value), 0);
  const pipeline = open.reduce((sum, lead) => sum + Number(lead.value), 0);
  return { won, open, active, revenue, pipeline, ticket: revenue / (won.length || 1), conversion: (won.length / leads.length) * 100 };
}

function avatar(name) { return name.charAt(0); }
function fill(width) { return `<span class="bar-fill" style="width:${Math.max(7, width)}%"></span>`; }

function renderDashboard() {
  const data = calc();
  $('#lead-count').textContent = leads.length;
  $('#overview').innerHTML = [
    ['Receita fechada', money(data.revenue), `${data.won.length} negócios ganhos`, 'primary'],
    ['Leads ativos', data.active.length, 'em acompanhamento', ''],
    ['Conversão', `${data.conversion.toFixed(1)}%`, `${data.won.length} ganhos`, ''],
    ['Pipeline', money(data.pipeline), 'negócios em curso', ''],
    ['Ticket médio', money(data.ticket), 'por venda fechada', '']
  ].map(([label, value, hint, type]) => `<article class="kpi ${type}"><small>${label}</small><strong>${value}</strong><span>${hint}</span></article>`).join('');

  const stageCounts = stages.filter(stage => stage !== 'Ganho').map(stage => ({ stage, count: leads.filter(lead => lead.stage === stage).length }));
  const maxStage = Math.max(...stageCounts.map(item => item.count), 1);
  $('#pipeline-total').textContent = money(data.pipeline);
  $('#pipeline-list').innerHTML = stageCounts.map(item => `<div class="pipeline-row"><label>${item.stage}</label><div class="bar-track">${fill(item.count / maxStage * 100)}</div><b>${item.count}</b></div>`).join('');

  const sellerData = sellers.map(name => ({ name, closed: leads.filter(lead => lead.seller === name && lead.stage === 'Ganho').reduce((sum, lead) => sum + Number(lead.value), 0), active: leads.filter(lead => lead.seller === name && !['Ganho','Perdido'].includes(lead.stage)).length })).sort((a,b) => b.closed - a.closed);
  $('#seller-summary').innerHTML = `<div class="seller-summary">${sellerData.map(item => `<div class="seller-line"><span class="seller-avatar">${avatar(item.name)}</span><div class="seller-info"><b>${item.name}</b><span>${item.active} leads ativos</span></div><strong>${money(item.closed)}</strong></div>`).join('')}</div>`;

  const months = [{label:'Abr',month:3},{label:'Mai',month:4},{label:'Jun',month:5},{label:'Jul',month:6},{label:'Ago',month:7},{label:'Set',month:8}];
  const values = months.map(item => leads.filter(lead => lead.stage === 'Ganho' && new Date(`${lead.date}T12:00`).getMonth() === item.month).reduce((sum, lead) => sum + Number(lead.value), 0));
  const maxRevenue = Math.max(...values, 1);
  $('#revenue-chart').innerHTML = months.map((item, index) => `<div class="revenue-bar"><i title="${money(values[index])}" style="height:${Math.max(9, values[index] / maxRevenue * 100)}%"></i><span>${item.label}</span></div>`).join('');

  const sourceData = origins.map(origin => ({ origin, count: leads.filter(lead => lead.origin === origin).length })).filter(item => item.count).sort((a,b) => b.count - a.count).slice(0,5);
  const maxOrigin = Math.max(...sourceData.map(item => item.count), 1);
  $('#origin-list').innerHTML = sourceData.map(item => `<div class="origin-row"><label>${item.origin}</label><div class="bar-track">${fill(item.count / maxOrigin * 100)}</div><b>${item.count}</b></div>`).join('');
}

function chip(stage) { return `<span class="chip ${plain(stage)}">${stage}</span>`; }
function renderLeads() {
  const query = $('#search').value.trim().toLowerCase();
  const stage = $('#stage-filter').value;
  const seller = $('#seller-filter').value;
  const visible = leads.filter(lead => (!query || lead.name.toLowerCase().includes(query) || lead.company.toLowerCase().includes(query)) && (!stage || lead.stage === stage) && (!seller || lead.seller === seller)).sort((a,b) => b.date.localeCompare(a.date));
  $('#lead-rows').innerHTML = visible.map(lead => `<tr><td><b>${lead.name}</b><small>${lead.company}</small></td><td>${lead.seller}</td><td>${lead.product}</td><td>${lead.origin}</td><td>${chip(lead.stage)}</td><td>${money(lead.value)}</td><td>${new Date(`${lead.date}T12:00`).toLocaleDateString('pt-BR')}</td></tr>`).join('') || `<tr><td colspan="7">Nenhum lead encontrado.</td></tr>`;
}

function renderPipeline() {
  const pipelineStages = stages.filter(stage => stage !== 'Ganho');
  $('#pipeline-open-value').textContent = money(calc().pipeline);
  $('#kanban').innerHTML = pipelineStages.map(stage => {
    const list = leads.filter(lead => lead.stage === stage).sort((a,b) => Number(b.value) - Number(a.value));
    return `<article class="kanban-column"><header><span>${stage}</span><span>${list.length}</span></header><div class="kanban-cards">${list.map(lead => `<article class="lead-card"><b>${lead.name}</b><span>${lead.company}</span><footer><span>${lead.seller}</span><b>${money(lead.value)}</b></footer></article>`).join('')}</div></article>`;
  }).join('');
}

function renderSellers() {
  $('#seller-rows').innerHTML = sellers.map(name => {
    const sellerLeads = leads.filter(lead => lead.seller === name);
    const active = sellerLeads.filter(lead => !['Ganho','Perdido'].includes(lead.stage));
    const won = sellerLeads.filter(lead => lead.stage === 'Ganho');
    const revenue = won.reduce((sum, lead) => sum + Number(lead.value), 0);
    const pipeline = active.reduce((sum, lead) => sum + Number(lead.value), 0);
    return `<tr><td><div class="seller-name"><span class="seller-avatar">${avatar(name)}</span><b>${name}</b></div></td><td>${active.length}</td><td>${won.length}</td><td>${(won.length / sellerLeads.length * 100).toFixed(1)}%</td><td>${money(pipeline)}</td><td>${money(revenue)}</td></tr>`;
  }).join('');
}

function render() { renderDashboard(); renderLeads(); renderPipeline(); renderSellers(); }

function setView(view) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  document.querySelectorAll('.view').forEach(item => item.classList.toggle('active', item.id === view));
  $('#page-title').textContent = { dashboard:'Dashboard', leads:'Leads', pipeline:'Pipeline', sellers:'Vendedores' }[view];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

['stage-filter','seller-filter'].forEach(id => { const values = id === 'stage-filter' ? [...stages, 'Perdido'] : sellers; $("#" + id).insertAdjacentHTML('beforeend', values.map(value => `<option value="${value}">${value}</option>`).join('')); });
document.querySelectorAll('.nav-item,[data-view="sellers"]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('#search').addEventListener('input', renderLeads);
$('#stage-filter').addEventListener('change', renderLeads);
$('#seller-filter').addEventListener('change', renderLeads);

const leadDialog = $('#lead-modal');
const form = $('#lead-form');
function openLeadDialog() { form.reset(); form.elements.date.value = new Date().toISOString().slice(0,10); leadDialog.showModal(); form.elements.name.focus(); }
document.querySelectorAll('.new-lead').forEach(button => button.addEventListener('click', openLeadDialog));
leadDialog.querySelector('.dialog-close').addEventListener('click', () => leadDialog.close());
leadDialog.querySelector('.cancel').addEventListener('click', () => leadDialog.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const lead = Object.fromEntries(new FormData(form));
  lead.id = Date.now(); lead.value = Number(lead.value);
  leads.push(lead); localStorage.setItem(storageKey, JSON.stringify(leads));
  render(); leadDialog.close(); setView('leads');
  $('#toast').textContent = 'Lead cadastrado com sucesso.'; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

const welcome = $('#welcome');
function closeWelcome() { welcome.close(); localStorage.setItem(welcomeKey, 'seen'); }
welcome.querySelectorAll('.dialog-close,.welcome-button').forEach(button => button.addEventListener('click', closeWelcome));
render();
if (!localStorage.getItem(welcomeKey)) welcome.showModal();
