const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
const setMenu = (open) => { nav?.classList.toggle('open', open); document.body.classList.toggle('menu-open', open); menuButton?.setAttribute('aria-expanded', String(open)); };
menuButton?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
const resumeContent = {
  perfil: { heading: 'Perfil profissional', lead: 'Analista com visão sistêmica, conectando processos, sistemas, dados e pessoas para construir soluções práticas.', leftTitle: 'FOCO', left: 'Processos<br>Operações<br>Sistemas & ERP<br>Automação', rightTitle: 'INTERESSES', right: 'Qualidade<br>Requisitos<br>Dados & indicadores<br>Melhoria contínua', foot: 'Aberta a oportunidades remotas em áreas de processos, sistemas, operações, qualidade, administração e comercial.' },
  habilidades: { heading: 'Habilidades que conectam', lead: 'Minha atuação reúne análise, organização e comunicação para fazer a ponte entre uma necessidade e uma solução viável.', leftTitle: 'ANÁLISE', left: 'Processos e gargalos<br>Regras de negócio<br>Dados e indicadores<br>Resolução de problemas', rightTitle: 'OPERAÇÃO', right: 'Automação & IA<br>Rotinas administrativas<br>Documentação<br>Integração entre áreas', foot: 'Facilidade para aprender novos contextos, estruturar informações e transformar complexidade em ações objetivas.' },
  comercial: { heading: 'Visão comercial e de negócio', lead: 'Três anos em contato com contextos e clientes diversos desenvolveram minha capacidade de escutar, investigar e identificar o que gera valor.', leftTitle: 'NA PRÁTICA', left: 'Entendimento de contexto<br>Comunicação adaptável<br>Levantamento de necessidades<br>Prioridades e oportunidades', rightTitle: 'VISÃO INTEGRADA', right: 'Comercial<br>Financeiro<br>Atendimento<br>Operações e sistemas', foot: 'Um olhar que considera a necessidade do cliente, o processo interno e o impacto da decisão para o negócio.' }
};
const paper = document.querySelector('#resume-paper');
document.querySelectorAll('.resume-tab').forEach((button) => button.addEventListener('click', () => { const data = resumeContent[button.dataset.resume]; document.querySelectorAll('.resume-tab').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); }); paper.classList.remove('paper-change'); void paper.offsetWidth; paper.querySelector('h3').textContent = data.heading; paper.querySelector('.paper-lead').textContent = data.lead; const columns = paper.querySelectorAll('.paper-columns div'); columns[0].querySelector('span').textContent = data.leftTitle; columns[0].querySelector('p').innerHTML = data.left; columns[1].querySelector('span').textContent = data.rightTitle; columns[1].querySelector('p').innerHTML = data.right; paper.querySelector('.paper-foot').textContent = data.foot; paper.classList.add('paper-change'); }));
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelectorAll('.contact-row a').forEach((link) => { link.textContent = link.textContent.replace(/\s*↗$/, ''); });
const favicon = document.querySelector('link[rel="icon"]');
if (favicon) favicon.setAttribute('href', 'assets/julia-logo.png');
const opportunityCopy = document.querySelector('.closing-copy');
if (opportunityCopy) opportunityCopy.innerHTML = 'Aberta a oportunidades <strong>100% remotas</strong> em Processos, Operações, Automação, Sistemas, Administrativo e Comercial.';
const orviaProject = document.querySelector('.project-leadflow');
if (orviaProject) {
  orviaProject.querySelector('h3').innerHTML = 'ORVIA';
  orviaProject.querySelector('.project-subtitle').textContent = 'Sales workspace';
  orviaProject.querySelector('.project-copy > p:not(.project-subtitle)').textContent = 'Workspace comercial para acompanhar leads, pipeline, receita e performance da operação.';
  orviaProject.querySelector('.button').innerHTML = 'Abrir workspace <span>↗</span>';
  orviaProject.querySelector('.browser-top b').textContent = 'ORVIA · dashboard';
  orviaProject.querySelector('.leadflow-art').setAttribute('aria-label', 'Demonstração visual do dashboard ORVIA');
}

// Os cases em desenvolvimento permanecem no código, mas a vitrine prioriza os projetos prontos.
const secondaryProjects = document.querySelector('.secondary-projects');
if (secondaryProjects) {
  secondaryProjects.insertAdjacentHTML('beforebegin', `
    <article class="project project-vetra reveal visible">
      <div class="project-vetra-copy">
        <p class="project-kicker">Process intelligence · operações</p>
        <h3>VET<span>RA</span></h3>
        <p class="project-subtitle">Process Intelligence Workspace</p>
        <p>Ferramenta criada para tornar visível como um processo realmente acontece: seus caminhos, desvios, esforço manual e oportunidades de melhoria.</p>
        <ul>
          <li>Leitura dos fluxos reais da operação</li>
          <li>Identificação de desvios, causas e retrabalho</li>
          <li>Priorização de melhorias e automações</li>
        </ul>
        <a class="button button-vetra" href="vetra/">Explorar a ferramenta <span aria-hidden="true">→</span></a>
      </div>
      <div class="vetra-art" aria-label="Demonstração visual da ferramenta VETRA">
        <div class="vetra-art-top"><img src="assets/vetra-mark.svg" alt=""><strong>VETRA</strong><span>Visão geral</span></div>
        <div class="vetra-art-copy"><small>Process intelligence workspace</small><b>Do processo ideal<br>ao processo <em>real.</em></b><p>Fluxos, desvios e oportunidades em uma única leitura.</p></div>
        <div class="vetra-path" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="vetra-art-card"><span>Oportunidades</span><strong>17</strong><small>priorizadas</small></div>
      </div>
    </article>
  `);
}

const resumePaper = document.querySelector('.resume-full');
if (resumePaper) {
  resumePaper.insertAdjacentHTML('beforeend', `
    <section class="tools-section" aria-labelledby="tools-title">
      <h4 id="tools-title">Ferramentas e tecnologias</h4>
      <p class="tools-intro">Ferramentas que uso para organizar demandas, mapear processos, analisar dados, construir soluções e publicar projetos.</p>
      <div class="tools-grid">
        <button class="tool-item" type="button" aria-label="Jira: organização de demandas e acompanhamento de fluxos"><img src="assets/tools/jira.png" alt="Jira"><span class="tool-name">Jira</span><span class="tool-tooltip" role="tooltip"><strong>Jira</strong>Organização de demandas, tarefas e acompanhamento de fluxos.</span></button>
        <button class="tool-item" type="button" aria-label="Visual Studio Code: edição e estruturação de projetos"><img src="assets/tools/vscode.png" alt="Visual Studio Code"><span class="tool-name">Visual Studio Code</span><span class="tool-tooltip" role="tooltip"><strong>Visual Studio Code</strong>Edição e estruturação de projetos, interfaces e automações.</span></button>
        <button class="tool-item" type="button" aria-label="Excel: análise de dados, controles e indicadores"><img src="assets/tools/excel.png" alt="Excel"><span class="tool-name">Excel</span><span class="tool-tooltip" role="tooltip"><strong>Excel</strong>Análises, controles, indicadores e organização de dados.</span></button>
        <button class="tool-item tool-item-github" type="button" aria-label="GitHub: versionamento e publicação dos projetos do portfólio"><img src="assets/tools/github.png" alt="GitHub"><span class="tool-name">GitHub</span><span class="tool-tooltip" role="tooltip"><strong>GitHub</strong>Versionamento e publicação dos projetos deste portfólio.</span></button>
        <button class="tool-item" type="button" aria-label="MySQL: consulta e organização de dados relacionais"><img src="assets/tools/mysql.png" alt="MySQL"><span class="tool-name">MySQL</span><span class="tool-tooltip" role="tooltip"><strong>MySQL</strong>Consulta e organização de dados relacionais.</span></button>
        <button class="tool-item" type="button" aria-label="Lucidchart: mapeamento de processos, fluxos e regras"><img src="assets/tools/lucidchart.png" alt="Lucidchart"><span class="tool-name">Lucidchart</span><span class="tool-tooltip" role="tooltip"><strong>Lucidchart</strong>Mapeamento de processos, fluxos e regras de negócio.</span></button>
        <button class="tool-item" type="button" aria-label="Salesforce: CRM, processos comerciais e gestão de dados"><img src="assets/tools/salesforce.png" alt="Salesforce"><span class="tool-name">Salesforce</span><span class="tool-tooltip" role="tooltip"><strong>Salesforce</strong>CRM, processos comerciais e gestão de dados.</span></button>
        <button class="tool-item" type="button" aria-label="ChatGPT e OpenAI: automação, análise e apoio à estruturação de processos"><img src="assets/tools/openai.png" alt="ChatGPT e OpenAI"><span class="tool-name">ChatGPT / OpenAI</span><span class="tool-tooltip" role="tooltip"><strong>ChatGPT / OpenAI</strong>Automação, análise e apoio à estruturação de processos.</span></button>
        <button class="tool-item" type="button" aria-label="Claude: análise, síntese e apoio à documentação"><img src="assets/tools/claude.png" alt="Claude"><span class="tool-name">Claude</span><span class="tool-tooltip" role="tooltip"><strong>Claude</strong>Análise, síntese e apoio à documentação.</span></button>
      </div>
    </section>
  `);
}

const toolItems = document.querySelectorAll('.tool-item');
const closeTooltips = () => toolItems.forEach((item) => {
  item.classList.remove('is-open');
  item.setAttribute('aria-expanded', 'false');
});
toolItems.forEach((item) => {
  item.setAttribute('aria-expanded', 'false');
  item.addEventListener('mouseenter', () => {
    if (!item.classList.contains('is-open')) closeTooltips();
  });
  item.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !item.classList.contains('is-open');
    closeTooltips();
    if (willOpen) {
      item.classList.add('is-open');
      item.setAttribute('aria-expanded', 'true');
    }
  });
  item.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTooltips();
      item.blur();
    }
  });
});
document.addEventListener('click', closeTooltips);
