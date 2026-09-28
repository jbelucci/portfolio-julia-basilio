const formatCurrency = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const inputs = { users: document.querySelector('#users'), cost: document.querySelector('#cost'), tools: document.querySelector('#tools') };
const output = { users: document.querySelector('#users-display'), cost: document.querySelector('#cost-display'), tools: document.querySelector('#tools-display'), annual: document.querySelector('#annual-cost') };

function updateCalculator() {
  const users = Math.max(1, Number(inputs.users.value) || 0);
  const cost = Math.max(0, Number(inputs.cost.value) || 0);
  const tools = Math.max(1, Number(inputs.tools.value) || 0);
  output.users.textContent = `${users} ${users === 1 ? 'usuário' : 'usuários'}`;
  output.cost.textContent = formatCurrency(cost);
  output.tools.textContent = `${tools} ${tools === 1 ? 'ferramenta' : 'ferramentas'}`;
  output.annual.innerHTML = `${formatCurrency(users * cost * tools * 12)} <small>/ ano</small>`;
}

Object.values(inputs).forEach(input => input.addEventListener('input', updateCalculator));
document.querySelector('#reset-calculator').addEventListener('click', () => {
  inputs.users.value = 40;
  inputs.cost.value = 80;
  inputs.tools.value = 2;
  updateCalculator();
  inputs.users.focus();
});
updateCalculator();
