const initialLoads = [
	{ id: "C-2048", name: "Componentes industriais", origin: "Campinas, SP", destination: "Curitiba, PR", distance: 412, vehicle: "Truck", weight: 8500, date: "2026-10-22", value: 2850, status: "Em trânsito", urgent: true, refrigerated: false, notes: "Coleta no período da manhã. Preferência por rota com parada programada." },
	{ id: "C-2047", name: "Alimentos congelados", origin: "Jundiaí, SP", destination: "Belo Horizonte, MG", distance: 586, vehicle: "Carreta refrigerada", weight: 12000, date: "2026-10-23", value: 4300, status: "Aberta", urgent: true, refrigerated: true, notes: "Manter temperatura entre -18 °C e -12 °C durante todo o percurso." },
	{ id: "C-2046", name: "Mobiliário corporativo", origin: "Joinville, SC", destination: "Porto Alegre, RS", distance: 597, vehicle: "Carreta", weight: 9600, date: "2026-10-24", value: 3760, status: "Aberta", urgent: false, refrigerated: false, notes: "Carga paletizada. Agendar janela de entrega com o destinatário." },
	{ id: "C-2045", name: "Insumos agrícolas", origin: "Ribeirão Preto, SP", destination: "Goiânia, GO", distance: 658, vehicle: "Truck", weight: 7200, date: "2026-10-24", value: 3420, status: "Aberta", urgent: false, refrigerated: false, notes: "Retirada em centro de distribuição. Nota fiscal disponível no embarque." },
	{ id: "C-2044", name: "Medicamentos", origin: "São Paulo, SP", destination: "Rio de Janeiro, RJ", distance: 434, vehicle: "Van", weight: 1800, date: "2026-10-23", value: 1950, status: "Aberta", urgent: false, refrigerated: true, notes: "Entrega com controle de temperatura e confirmação de recebimento." },
	{ id: "C-2043", name: "Peças de reposição", origin: "Sorocaba, SP", destination: "Londrina, PR", distance: 383, vehicle: "VUC", weight: 2400, date: "2026-10-25", value: 1680, status: "Aberta", urgent: false, refrigerated: false, notes: "Acesso urbano. Entrega no endereço indicado pelo embarcador." }
];

const initialDrivers = [
	{ name: "Marcos Oliveira", city: "Campinas, SP", category: "E", experience: "8 anos", status: "Verificada", initials: "MO" },
	{ name: "Ana Paula Santos", city: "São Paulo, SP", category: "D", experience: "6 anos", status: "Verificada", initials: "AS" },
	{ name: "Rafael Costa", city: "Curitiba, PR", category: "E", experience: "12 anos", status: "Verificada", initials: "RC" },
	{ name: "Juliana Ferreira", city: "Joinville, SC", category: "D", experience: "5 anos", status: "Em análise", initials: "JF" },
	{ name: "Diego Almeida", city: "Ribeirão Preto, SP", category: "C", experience: "9 anos", status: "Verificada", initials: "DA" }
];

const storageKey = "vw-cargas-demo-v1";
const savedLoads = readSavedLoads();
let loads = [...initialLoads, ...savedLoads];
let drivers = [...initialDrivers];
let selectedFilter = "all";
let activeLoad = null;
let toastTimer;

function readSavedLoads() {
	try {
		const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
		return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.name) : [];
	} catch {
		return [];
	}
}

function saveLoads() {
	try {
		localStorage.setItem(storageKey, JSON.stringify(loads.filter((load) => load.createdByUser)));
	} catch {
		showToast("Carga adicionada nesta sessão, mas não foi possível salvá-la neste navegador.");
	}
}

function formatCurrency(value) {
	return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(value) {
	if (!value) return "A combinar";
	return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function escapeHTML(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function showToast(message) {
	const toast = document.querySelector("#toast");
	toast.textContent = message;
	toast.classList.add("is-visible");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function renderRecentLoads() {
	const target = document.querySelector("#recent-loads");
	target.innerHTML = loads.slice(0, 3).map((load) => `
		<div class="recent-load"><strong>${escapeHTML(load.name)}</strong><span>${escapeHTML(load.origin.split(",")[0])} → ${escapeHTML(load.destination.split(",")[0])}</span><small>${escapeHTML(load.vehicle)} · ${formatDate(load.date)}</small><b>${formatCurrency(load.value)}</b></div>`).join("");
}

function renderLoads() {
	const search = document.querySelector("#load-search").value.trim().toLocaleLowerCase("pt-BR");
	const sort = document.querySelector("#load-sort").value;
	let visibleLoads = loads.filter((load) => {
		const searchable = `${load.name} ${load.origin} ${load.destination} ${load.vehicle}`.toLocaleLowerCase("pt-BR");
		const matchesSearch = searchable.includes(search);
		const matchesFilter = selectedFilter === "all" || (selectedFilter === "urgente" && load.urgent) || (selectedFilter === "refrigerada" && load.refrigerated);
		return matchesSearch && matchesFilter;
	});

	visibleLoads = [...visibleLoads].sort((first, second) => {
		if (sort === "value") return second.value - first.value;
		if (sort === "distance") return second.distance - first.distance;
		return Number(Boolean(second.createdByUser)) - Number(Boolean(first.createdByUser)) || second.id.localeCompare(first.id);
	});

	document.querySelector("#loads-summary-text").textContent = `${visibleLoads.length} ${visibleLoads.length === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}`;
	document.querySelector("#filter-count-all").textContent = String(loads.length).padStart(2, "0");
	const list = document.querySelector("#loads-list");
	if (!visibleLoads.length) {
		list.innerHTML = '<div class="empty-state">Nenhuma carga encontrada. Tente outra busca ou publique uma nova oportunidade.</div>';
		return;
	}
	list.innerHTML = visibleLoads.map((load) => `
		<article class="load-card">
			<div class="load-card-main"><div class="load-card-title"><strong>${escapeHTML(load.name)}</strong>${load.urgent ? '<span class="tag-urgent">URGENTE</span>' : ""}${load.refrigerated ? '<span class="tag-cold">FRIGORIFICADA</span>' : ""}</div><small>${escapeHTML(load.id)} · Publicada ${load.createdByUser ? "agora" : "há 2 h"}</small></div>
			<div class="load-route"><span class="route-endpoint"><strong>${escapeHTML(load.origin)}</strong><small>ORIGEM</small></span><span class="route-arrow-line">→</span><span class="route-endpoint"><strong>${escapeHTML(load.destination)}</strong><small>DESTINO</small></span></div>
			<div class="load-card-details"><strong>${escapeHTML(load.vehicle)}</strong><small>${Number(load.weight).toLocaleString("pt-BR")} kg · ${load.distance} km</small></div>
			<div class="load-value"><strong>${formatCurrency(load.value)}</strong><small>Coleta ${formatDate(load.date)}</small></div>
			<div class="card-actions"><button class="button button-outline" data-load-details="${escapeHTML(load.id)}">Detalhes</button><button class="button button-dark" data-load-interest="${escapeHTML(load.id)}">Tenho interesse</button></div>
		</article>`).join("");
}

function renderDrivers() {
	const search = document.querySelector("#driver-search").value.trim().toLocaleLowerCase("pt-BR");
	const visibleDrivers = drivers.filter((driver) => `${driver.name} ${driver.city}`.toLocaleLowerCase("pt-BR").includes(search));
	document.querySelector("#driver-total").textContent = `${248 + Math.max(0, drivers.length - initialDrivers.length)} profissionais`;
	const body = document.querySelector("#drivers-table-body");
	if (!visibleDrivers.length) {
		body.innerHTML = '<tr><td colspan="5"><div class="empty-state">Nenhum motorista encontrado nesta sessão.</div></td></tr>';
		return;
	}
	body.innerHTML = visibleDrivers.map((driver) => `
		<tr><td><div class="driver-person"><span class="driver-initials">${escapeHTML(driver.initials)}</span><span><strong>${escapeHTML(driver.name)}</strong><small>${escapeHTML(driver.city)}</small></span></div></td><td>CNH · ${escapeHTML(driver.category)}</td><td>${escapeHTML(driver.experience || "Cadastro novo")}</td><td><span class="${driver.status === "Verificada" ? "doc-verified" : "doc-review"}">${escapeHTML(driver.status)}</span></td><td><button class="table-action" aria-label="Opções para ${escapeHTML(driver.name)}">···</button></td></tr>`).join("");
}

function updateCounts() {
	document.querySelector("#stat-loads").textContent = String(loads.length).padStart(2, "0");
	document.querySelector("#nav-load-count").textContent = String(loads.length).padStart(2, "0");
}

function navigate(viewName) {
	document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-visible", view.id === `view-${viewName}`));
	document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.view === viewName));
	const titles = { overview: "Visão geral", loads: "Cargas", drivers: "Motoristas" };
	document.querySelector("#current-crumb").textContent = titles[viewName] || titles.overview;
	if (viewName === "loads") renderLoads();
	if (viewName === "drivers") renderDrivers();
	window.scrollTo({ top: 0, behavior: "smooth" });
}

function openDialog(id) {
	const dialog = document.getElementById(id);
	if (dialog && !dialog.open) dialog.showModal();
}

function showLoadDetails(load) {
	activeLoad = load;
	document.querySelector("#detail-title").textContent = load.name;
	document.querySelector("#detail-content").innerHTML = `<div class="detail-body"><div class="detail-item"><span>ORIGEM</span><strong>${escapeHTML(load.origin)}</strong></div><div class="detail-item"><span>DESTINO</span><strong>${escapeHTML(load.destination)}</strong></div><div class="detail-item"><span>VEÍCULO</span><strong>${escapeHTML(load.vehicle)}</strong></div><div class="detail-item"><span>PESO ESTIMADO</span><strong>${Number(load.weight).toLocaleString("pt-BR")} kg</strong></div><div class="detail-item"><span>COLETA</span><strong>${formatDate(load.date)}</strong></div><div class="detail-item"><span>FRETE</span><strong>${formatCurrency(load.value)}</strong></div><div class="detail-notes">${escapeHTML(load.notes || "Sem instruções adicionais para esta rota.")}</div></div>`;
	openDialog("detail-dialog");
}

function applyLicenseMask(input) {
	const digits = input.value.replace(/\D/g, "").slice(0, 11);
	input.value = digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validatePhoto(file) {
	const status = document.querySelector("#photo-status");
	const zone = document.querySelector("#upload-zone");
	const preview = document.querySelector("#photo-preview");
	const title = document.querySelector("#upload-title");
	zone.classList.remove("has-preview");
	status.className = "photo-status";
	if (!file) {
		status.textContent = "A imagem será analisada neste dispositivo.";
		return Promise.resolve(false);
	}
	if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return photoError("Formato não aceito. Use JPG, PNG ou WEBP.");
	if (file.size > 5 * 1024 * 1024) return photoError("Arquivo maior que 5 MB. Escolha uma imagem menor.");

	return new Promise((resolve) => {
		const image = new Image();
		const objectUrl = URL.createObjectURL(file);
		image.onload = () => {
			URL.revokeObjectURL(objectUrl);
			if (image.naturalWidth < 600 || image.naturalHeight < 350) {
				photoError(`Resolução insuficiente (${image.naturalWidth} × ${image.naturalHeight}). O mínimo é 600 × 350 px.`).then(resolve);
				return;
			}
			preview.src = URL.createObjectURL(file);
			zone.classList.add("has-preview");
			title.textContent = file.name;
			status.textContent = `Imagem pré-validada: ${image.naturalWidth} × ${image.naturalHeight} px. Autenticidade não verificada.`;
			status.classList.add("is-valid");
			resolve(true);
		};
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			photoError("Não foi possível abrir a imagem. Selecione outro arquivo.").then(resolve);
		};
		image.src = objectUrl;
	});
}

function photoError(message) {
	const status = document.querySelector("#photo-status");
	status.textContent = message;
	status.className = "photo-status is-error";
	return Promise.resolve(false);
}

document.addEventListener("click", (event) => {
	const nav = event.target.closest("[data-view]");
	if (nav) navigate(nav.dataset.view);
	const jump = event.target.closest("[data-navigate]");
	if (jump) navigate(jump.dataset.navigate);
	const opener = event.target.closest("[data-open-dialog]");
	if (opener) openDialog(opener.dataset.openDialog);
	const closer = event.target.closest("[data-close-dialog]");
	if (closer) closer.closest("dialog").close();
	const details = event.target.closest("[data-load-details]");
	if (details) showLoadDetails(loads.find((load) => load.id === details.dataset.loadDetails));
	const interest = event.target.closest("[data-load-interest]");
	if (interest) {
		const load = loads.find((item) => item.id === interest.dataset.loadInterest);
		showToast(`Interesse registrado na carga ${load.id}. A transportadora poderá entrar em contato.`);
	}
});

document.querySelector("#load-search").addEventListener("input", renderLoads);
document.querySelector("#load-sort").addEventListener("change", renderLoads);
document.querySelector("#driver-search").addEventListener("input", renderDrivers);
document.querySelectorAll(".filter-tab").forEach((tab) => tab.addEventListener("click", () => {
	selectedFilter = tab.dataset.filter;
	document.querySelectorAll(".filter-tab").forEach((item) => item.classList.toggle("is-selected", item === tab));
	renderLoads();
}));

document.querySelector("#load-form").addEventListener("submit", (event) => {
	event.preventDefault();
	const data = new FormData(event.currentTarget);
	const load = {
		id: `C-${Date.now().toString().slice(-6)}`,
		name: data.get("name").trim(),
		origin: data.get("origin").trim(),
		destination: data.get("destination").trim(),
		vehicle: data.get("vehicle"),
		weight: Number(data.get("weight")),
		date: data.get("date"),
		value: Number(data.get("value")),
		distance: 0,
		status: "Aberta",
		urgent: false,
		refrigerated: data.has("refrigerated"),
		notes: data.get("notes").trim(),
		createdByUser: true
	};
	loads.unshift(load);
	saveLoads();
	updateCounts();
	renderRecentLoads();
	renderLoads();
	event.currentTarget.reset();
	event.currentTarget.closest("dialog").close();
	navigate("loads");
	showToast("Carga publicada. Ela já aparece no mural de oportunidades.");
});

const photoInput = document.querySelector("#license-photo");
photoInput.addEventListener("change", () => validatePhoto(photoInput.files[0]));
const uploadZone = document.querySelector("#upload-zone");
uploadZone.addEventListener("dragover", (event) => { event.preventDefault(); uploadZone.classList.add("is-dragging"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("is-dragging"));
uploadZone.addEventListener("drop", (event) => {
	event.preventDefault();
	uploadZone.classList.remove("is-dragging");
	const file = event.dataTransfer.files[0];
	if (file) {
		const transfer = new DataTransfer();
		transfer.items.add(file);
		photoInput.files = transfer.files;
		validatePhoto(file);
	}
});
document.querySelector("[name='cpf']").addEventListener("input", (event) => applyLicenseMask(event.currentTarget));

document.querySelector("#driver-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	const form = event.currentTarget;
	const data = new FormData(form);
	const cpfDigits = data.get("cpf").replace(/\D/g, "");
	if (cpfDigits.length !== 11) {
		showToast("Confira o CPF: informe os 11 dígitos.");
		return;
	}
	const photoIsValid = await validatePhoto(photoInput.files[0]);
	if (!photoIsValid) {
		showToast("Envie uma foto válida da CNH antes de concluir.");
		return;
	}
	const name = data.get("name").trim();
	drivers.unshift({ name, city: data.get("city").trim(), category: data.get("category"), experience: "Cadastro novo", status: "Em análise", initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() });
	renderDrivers();
	form.reset();
	document.querySelector("#upload-zone").classList.remove("has-preview");
	document.querySelector("#photo-preview").removeAttribute("src");
	document.querySelector("#upload-title").textContent = "Arraste a foto ou clique para selecionar";
	document.querySelector("#photo-status").textContent = "A imagem será analisada neste dispositivo.";
	document.querySelector("#photo-status").className = "photo-status";
	form.closest("dialog").close();
	navigate("drivers");
	showToast("Cadastro recebido. CNH pré-validada e marcada para análise.");
});

document.querySelector("#interest-button").addEventListener("click", () => {
	if (!activeLoad) return;
	document.querySelector("#detail-dialog").close();
	showToast(`Interesse registrado na carga ${activeLoad.id}. A transportadora poderá entrar em contato.`);
});

document.querySelector("#route-details").addEventListener("click", () => showToast("Rota demonstrativa: Campinas → Curitiba · 412 km restantes."));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
	if (event.target === dialog) dialog.close();
}));

const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
document.querySelector("#today-label").textContent = dateLabel.format(new Date());
document.querySelector("#stat-drivers").textContent = String(243 + initialDrivers.length);
updateCounts();
renderRecentLoads();
renderLoads();
renderDrivers();
