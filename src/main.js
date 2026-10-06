// src/main.js
import { dbRef, onValue, set } from './config/firebase.js';
import { updateRoleDetails, processQuizAndSubmit } from './modulos/portalAluno.js';
import { renderAnalyticsTable } from './modulos/professor.js';

let currentState = {
    cash: 100000,
    inventory: 10,
    finishedGoods: 0,
    sla: 100,
    grossRevenue: 0,
    cpv: 0,
    opsCost: 0,
    candidates: [],
    analytics: {},
    kardex: [{ op: 'Estoque Inicial', qty: 10, val: 500, date: 'Inicial' }],
    prodLog: [],
    rncLog: []
};

const savedState = localStorage.getItem('spae_state');
if (savedState) {
    try { currentState = { ...currentState, ...JSON.parse(savedState) }; } catch(e) {}
}

// Troca de Abas
window.switchTab = (tabId) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active');
    
    const targetNav = document.getElementById(tabId.replace('tab', 'nav-tab'));
    if (targetNav) targetNav.classList.add('active');
};

window.submitCandidate = () => processQuizAndSubmit(dbRef, currentState);
window.updateRoleDetails = updateRoleDetails;

// Aprovação de Aluno
window.approveStudentAction = (studentId) => {
    const cand = (currentState.candidates || []).find(c => c.id === studentId);
    if (cand) {
        cand.status = 'APPROVED';
        
        const navTab1 = document.getElementById('nav-tab1');
        if (navTab1) navTab1.classList.remove('btn-neon-pulse');
        
        const navTab2 = document.getElementById('nav-tab2');
        if (navTab2) navTab2.classList.add('btn-neon-pulse');

        const gpsText = document.getElementById('gpsText');
        if (gpsText) {
            gpsText.innerHTML = `PASSO 3: Aluno ${cand.name} aprovado! Acesse a aba "2. Setup RH & Equipes" para gerenciar o time.`;
        }

        saveAndSync();
        alert(`✅ Aluno ${cand.name} aprovado com sucesso!`);
    }
};

// Aba 2 - Presença Ponto Digital
window.registerPresence = () => {
    const turno = document.getElementById('pontoTurno')?.value || '1º Turno';
    const pontoStatus = document.getElementById('pontoStatus');
    if (pontoStatus) {
        pontoStatus.innerHTML = `✅ Presença confirmada para a equipe no <strong>${turno}</strong> às ${new Date().toLocaleTimeString('pt-BR')}!`;
    }
};

// Aba 3 - Gerência Geral Comunicado
window.postNotice = () => {
    const txt = document.getElementById('txtComunicado')?.value;
    if (!txt) {
        alert('Digite o texto do comunicado.');
        return;
    }
    const lastNotice = document.getElementById('lastNotice');
    if (lastNotice) {
        lastNotice.innerText = `📢 Último Comunicado: "${txt}" (${new Date().toLocaleTimeString('pt-BR')})`;
    }
    alert('📢 Comunicado emitido para todos os módulos da fábrica!');
};

// Aba 4 - Cálculo e Compra de Insumos
window.calcOrderCost = () => {
    const unitPrice = parseInt(document.getElementById('selectSupplier')?.value || '500', 10);
    const qty = parseInt(document.getElementById('buyQty')?.value || '1', 10);
    const total = unitPrice * (qty > 0 ? qty : 1);
    const lbl = document.getElementById('lblTotalCost');
    if (lbl) lbl.innerText = `R$ ${total.toLocaleString('pt-BR')},00`;
};

window.buySupplies = () => {
    const unitPrice = parseInt(document.getElementById('selectSupplier')?.value || '500', 10);
    const qty = parseInt(document.getElementById('buyQty')?.value || '1', 10);
    const totalCost = unitPrice * qty;

    if (currentState.cash < totalCost) {
        alert('❌ Saldo insuficiente no Caixa da Empresa!');
        return;
    }

    currentState.cash -= totalCost;
    currentState.cpv += totalCost;
    currentState.inventory += qty;
    
    currentState.kardex.unshift({
        op: 'Compra de Insumo',
        qty: qty,
        val: unitPrice,
        date: new Date().toLocaleTimeString('pt-BR')
    });

    saveAndSync();
    alert(`📦 Ordem de Compra confirmada! ${qty} insumos adicionados ao estoque.`);
};

// Aba 5 - Operação & Produção
window.produceItem = () => {
    const qty = parseInt(document.getElementById('prodQty')?.value || '1', 10);

    if (currentState.inventory < qty) {
        alert('❌ Insumos insuficientes no Estoque! Compre mais insumos na Aba 4.');
        return;
    }

    currentState.inventory -= qty;
    currentState.finishedGoods += qty;
    
    currentState.prodLog.unshift({
        lote: `LOT_${Math.floor(Math.random() * 899 + 100)}`,
        qty: qty,
        status: 'Aguardando Inspeção'
    });

    saveAndSync();
    alert(`⚙️ Produção concluída! ${qty} unidade(s) transferida(s) para os Produtos Acabados.`);
};

// Aba 6 - Inspeção de Qualidade
window.inspectQuality = () => {
    const resultDiv = document.getElementById('inspectResult');
    if (currentState.finishedGoods === 0) {
        if (resultDiv) resultDiv.innerHTML = `<span style="color:var(--accent-orange)">⚠️ Nenhum produto em estoque para inspecionar.</span>`;
        return;
    }

    if (resultDiv) {
        resultDiv.innerHTML = `<span style="color:var(--neon-green-glow)">✅ Inspeção concluída: 100% dos produtos do lote aprovados conforme especificação técnica!</span>`;
    }
};

// Aba 7 - Faturamento de Vendas (Financeiro)
window.sellFinishedGoods = () => {
    if (currentState.finishedGoods === 0) {
        alert('❌ Não há produtos acabados no estoque para vender!');
        return;
    }

    const qty = currentState.finishedGoods;
    const revenue = qty * 1500; // Valor de venda por unidade

    currentState.cash += revenue;
    currentState.grossRevenue += revenue;
    currentState.finishedGoods = 0;

    saveAndSync();
    alert(`💰 Venda realizada! ${qty} unidade(s) faturada(s) por R$ ${revenue.toLocaleString('pt-BR')},00!`);
};

function saveAndSync() {
    localStorage.setItem('spae_state', JSON.stringify(currentState));
    updateUI();
    if (dbRef && set) set(dbRef, currentState);
}

function updateUI() {
    const hudCash = document.getElementById('hudCash');
    const hudInventory = document.getElementById('hudInventory');
    const hudFinished = document.getElementById('hudFinished');
    const hudSLA = document.getElementById('hudSLA');
    const hudStudents = document.getElementById('hudStudents');

    const formattedCash = `R$ ${(currentState.cash || 0).toLocaleString('pt-BR')},00`;

    if (hudCash) hudCash.innerText = formattedCash;
    if (hudInventory) hudInventory.innerText = `${currentState.inventory || 0} Unid`;
    if (hudFinished) hudFinished.innerText = `${currentState.finishedGoods || 0} Unid`;
    if (hudSLA) hudSLA.innerText = `${currentState.sla || 100}%`;
    if (hudStudents) hudStudents.innerText = `${currentState.candidates ? currentState.candidates.length : 0} Inscritos`;

    // DRE
    const dreGross = document.getElementById('dreGrossRevenue');
    const dreCPV = document.getElementById('dreCPV');
    const dreOps = document.getElementById('dreOpsCost');
    const dreCashVal = document.getElementById('dreCashVal');

    if (dreGross) dreGross.innerText = `R$ ${(currentState.grossRevenue || 0).toLocaleString('pt-BR')},00`;
    if (dreCPV) dreCPV.innerText = `R$ ${(currentState.cpv || 0).toLocaleString('pt-BR')},00`;
    if (dreOps) dreOps.innerText = `R$ ${(currentState.opsCost || 0).toLocaleString('pt-BR')},00`;
    if (dreCashVal) dreCashVal.innerText = formattedCash;

    // Tabelas Operacionais
    const tblKardex = document.getElementById('tblKardex');
    if (tblKardex && currentState.kardex) {
        tblKardex.innerHTML = currentState.kardex.map(k => `
            <tr>
                <td>${k.op}</td>
                <td>${k.qty} Unid</td>
                <td>R$ ${k.val.toLocaleString('pt-BR')},00</td>
                <td>${k.date}</td>
            </tr>
        `).join('');
    }

    const tblProd = document.getElementById('tblProductionLog');
    if (tblProd && currentState.prodLog && currentState.prodLog.length > 0) {
        tblProd.innerHTML = currentState.prodLog.map(p => `
            <tr>
                <td><strong>${p.lote}</strong></td>
                <td>${p.qty} Unid</td>
                <td><span style="color:var(--neon-green-glow);">${p.status}</span></td>
            </tr>
        `).join('');
    }

    // Lista de Aprovados no Setup RH
    const approvedList = document.getElementById('listApprovedStaff');
    if (approvedList) {
        const approved = (currentState.candidates || []).filter(c => c.status === 'APPROVED');
        if (approved.length > 0) {
            approvedList.innerHTML = approved.map(c => `<li>👤 <strong>${c.name}</strong> — ${c.role} (<span style="color:var(--neon-green)">Ativo</span>)</li>`).join('');
        } else {
            approvedList.innerHTML = `<li style="color:var(--text-muted);">Aguardando aprovação de candidatos na Aba 1...</li>`;
        }
    }

    renderAnalyticsTable(currentState.analytics, currentState.candidates);
}

if (dbRef && onValue) {
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) currentState = { ...currentState, ...data };
        updateUI();
    }, () => console.warn("Modo local ativo."));
}

document.addEventListener('DOMContentLoaded', () => {
    updateRoleDetails();
    updateUI();
});