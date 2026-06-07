/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Shield, MapPin, Camera, Search, User, LogIn, LogOut, CheckCircle2, 
  AlertTriangle, Clock, Map, ClipboardList, Send, Edit, Trash2, Settings, Plus,
  Sparkles, FileSpreadsheet, FileDown, ArrowRight, ArrowLeft, CornerDownRight, Check, X, 
  HelpCircle, ShieldCheck, Heart, Navigation, Eye, UserCheck, Palette, Mail, Megaphone
} from "lucide-react";
import { 
  Manifestacao, Secretaria, Usuario, UserPerfil, 
  ManifestacaoTipo, ManifestacaoStatus, ManifestacaoPrioridade, HeaderConfig 
} from "./types";
import Header from "./components/Header";
import ReportHeatmap from "./components/ReportHeatmap";

// Use current dynamic date for SLA calculations and real time analysis
const SYSTEM_PRESENT_DATE = new Date();

export default function App() {
  // Application State
  const [publicidadesTop, setPublicidadesTop] = useState<any[]>([]);
  const [publicidadeBottom, setPublicidadeBottom] = useState<any>(null);
  
  // Administrative Editing States for Publicities
  const [editingTopAd, setEditingTopAd] = useState<any | null>(null);
  const [showTopAdModal, setShowTopAdModal] = useState(false);
  const [editWelcomeGreeting, setEditWelcomeGreeting] = useState("");

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [activeAdDetail, setActiveAdDetail] = useState<any | null>(null);

  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([]);
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    municipioNome: "Câmara de Rio Claro",
    nomePrograma: "OuviVereador IA — Ouvidoria Inteligente",
    logoUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=120",
    backgroundColor: "#024a30",
    textColor: "#ffffff"
  });

  // UI state managers
  const [activeTab, setActiveTab] = useState<"cidadao" | "admin">("cidadao");
  const [cidadaoSubTab, setCidadaoSubTab] = useState<"inicio" | "abrir" | "consultar">("inicio");
  
  // Logged-in Auth state
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  // Forms states
  const [searchProtocolo, setSearchProtocolo] = useState("");
  const [searchResult, setSearchResult] = useState<Manifestacao | null>(null);

  // Abertura Form states
  const [tipoInput, setTipoInput] = useState<ManifestacaoTipo>(ManifestacaoTipo.RECLAMACAO);
  const [descricaoInput, setDescricaoInput] = useState("");
  const [vereadorTarget, setVereadorTarget] = useState("todos"); // specific id, todos or ouvidoria
  const [bairroInput, setBairroInput] = useState("Centro");
  const [consentLgpd, setConsentLgpd] = useState(false);
  const [fotoUrlInput, setFotoUrlInput] = useState<string | null>(null);
  const [useGpsGeoInput, setUseGpsGeoInput] = useState(false);
  const [anonymousReporter, setAnonymousReporter] = useState(false);

  // Form citizen registers (Upper Right)
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAuthOfferModal, setShowAuthOfferModal] = useState(false);
  const [authOfferStep, setAuthOfferStep] = useState<"choose" | "confirm-send">("choose");
  const [showRecuperarModal, setShowRecuperarModal] = useState(false);

  // Sign up inputs
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelefone, setRegTelefone] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regEndereco, setRegEndereco] = useState("");
  const [regBairro, setRegBairro] = useState("Centro");
  const [regCpf, setRegCpf] = useState("");

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");

  // First Access password change trigger
  const [showPasswordRenew, setShowPasswordRenew] = useState(false);
  const [renewPasswordInput, setRenewPasswordInput] = useState("");

  // Admin and secretaries managers
  const [selectedTicket, setSelectedTicket] = useState<Manifestacao | null>(null);
  const [workspaceAnswerMsg, setWorkspaceAnswerMsg] = useState("");
  const [forwardSecId, setForwardSecId] = useState("");
  const [reclassCategory, setReclassCategory] = useState("");
  const [reclassPriority, setReclassPriority] = useState<ManifestacaoPrioridade>(ManifestacaoPrioridade.MEDIA);
  const [resolutionObs, setResolutionObs] = useState("");
  const [forwardDestination, setForwardDestination] = useState("");

  // Administrative filters
  const [adminFilterBairro, setAdminFilterBairro] = useState("todos");
  const [adminFilterPrioridade, setAdminFilterPrioridade] = useState("todos");
  const [adminFilterStatus, setAdminFilterStatus] = useState("todos");
  const [adminFilterSec, setAdminFilterSec] = useState("todos");
  const [adminFilterDateFrom, setAdminFilterDateFrom] = useState("");
  const [adminFilterDateTo, setAdminFilterDateTo] = useState("");
  const [adminFilterAssunto, setAdminFilterAssunto] = useState("");
  const [adminFilterOrgao, setAdminFilterOrgao] = useState("");
  const [adminFilterEmail, setAdminFilterEmail] = useState("");
  const [adminFilterAlerta, setAdminFilterAlerta] = useState("todos");
  const [adminFilterMarcadasOnly, setAdminFilterMarcadasOnly] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [adminReportType, setAdminReportType] = useState<"dashboard" | "secretarias" | "finance" | "usuarios" | "auditoria" | "configuracoes">("dashboard");

  // Admin users manager
  const [showUserAddModal, setShowUserAddModal] = useState(false);
  const [addUserNome, setAddUserNome] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserTelefone, setAddUserTelefone] = useState("");
  const [addUserPerfil, setAddUserPerfil] = useState<UserPerfil>(UserPerfil.VEREADOR);
  const [addUserSenha, setAddUserSenha] = useState("mudar123");
  const [addUserCargoNome, setAddUserCargoNome] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [addUserEmailAlternativo, setAddUserEmailAlternativo] = useState("");

  // AI Assisted Despacho Cabinet
  const [dispatchResponsavelId, setDispatchResponsavelId] = useState("");
  const [dispatchDespachoText, setDispatchDespachoText] = useState("");
  const [isImprovingDispatch, setIsImprovingDispatch] = useState(false);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);
  const [dispatchProofResult, setDispatchProofResult] = useState<{
    copiedSender?: string | null;
    copiedReceiver?: string | null;
    proofLogs: string[];
  } | null>(null);

  // Admin cargos manager
  const [cargos, setCargos] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [addCargoNome, setAddCargoNome] = useState("");
  const [addCargoDescricao, setAddCargoDescricao] = useState("");
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  // Admin secretarias manager
  const [showSecAddModal, setShowSecAddModal] = useState(false);
  const [addSecNome, setAddSecNome] = useState("");
  const [addSecEmail, setAddSecEmail] = useState("");
  const [addSecResp, setAddSecResp] = useState("");
  const [editingSecId, setEditingSecId] = useState<string | null>(null);

  // System notification feedback messages
  const [toastMessage, setToastMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [openTicketFeedback, setOpenTicketFeedback] = useState<Manifestacao | null>(null);

  // New States for Email Report and Local Filter
  const [emailDestinatarioLocal, setEmailDestinatarioLocal] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [ticketForEmail, setTicketForEmail] = useState<Manifestacao | null>(null);
  const [showGlobalReportModal, setShowGlobalReportModal] = useState(false);
  const [reportEmailDestination, setReportEmailDestination] = useState("");
  const [isSendingGlobalReport, setIsSendingGlobalReport] = useState(false);
  const [batchAcao, setBatchAcao] = useState<"encaminhar" | "excluir" | "enviar-responsavel">("encaminhar");
  const [batchDestino, setBatchDestino] = useState("");
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [meusProtocolosFilter, setMeusProtocolosFilter] = useState("");

  // Mock File system attachments pictures options for citizens
  const presetPhotos = [
    { label: "Foto 1 (Asfalto Danificado)", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=620" },
    { label: "Foto 2 (Poste Escuro)", url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=620" },
    { label: "Foto 3 (Cacote de Lixo na Via)", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=620" }
  ];

  // Load backend configurations and DB entries
  const fetchData = async () => {
    try {
      const resConfig = await fetch("/api/header-config");
      if (resConfig.ok) {
        const configData = await resConfig.json();
        setHeaderConfig(configData);
        if (configData.welcomeGreeting) {
          setEditWelcomeGreeting(configData.welcomeGreeting);
        } else {
          setEditWelcomeGreeting("Bem-vindo à Ouvidoria Câmara Municipal Alagoinhas/ BA");
        }
      }

      const resPubs = await fetch("/api/publicidades");
      if (resPubs.ok) {
        const pubsData = await resPubs.json();
        setPublicidadesTop(pubsData.publicidadesTop || []);
        setPublicidadeBottom(pubsData.publicidadeBottom || null);
      }

      const resSec = await fetch("/api/secretarias");
      if (resSec.ok) {
        const secData = await resSec.json();
        setSecretarias(secData);
      }

      // Fetch complaints with authenticated context profiles
      let urlM = "/api/manifestacoes";
      if (currentUser) {
        urlM += `?usuarioId=${encodeURIComponent(currentUser.id)}&perfil=${encodeURIComponent(currentUser.perfil)}&vId=${encodeURIComponent(currentUser.id)}`;
      }
      const resM = await fetch(urlM);
      if (resM.ok) {
        const mData = await resM.json();
        setManifestacoes(mData);
      }

      // Fetch users (If admin, it filters by createdBy accordingly)
      let urlU = `/api/usuarios`;
      if (currentUser) {
        urlU += `?adminId=${encodeURIComponent(currentUser.id)}&perfilAdmin=${encodeURIComponent(currentUser.perfil)}`;
      }
      const resU = await fetch(urlU);
      if (resU.ok) {
        const uData = await resU.json();
        setUsuarios(uData);
      }

      const resCargos = await fetch("/api/cargos");
      if (resCargos.ok) {
        const cargosData = await resCargos.json();
        setCargos(cargosData);
      }

      const resLogs = await fetch("/api/logs");
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setAuditLogs(logsData);
      }
    } catch (err) {
      console.error("Erro ao sincronizar informações com o servidor:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.perfil === UserPerfil.CITIZEN) {
        setActiveTab("cidadao");
      } else {
        setActiveTab("admin");
      }
    } else {
      setActiveTab("cidadao");
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.perfil !== UserPerfil.ADMIN) {
      setAdminReportType("dashboard");
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedTicket) {
      setResolutionObs(selectedTicket.observacaoResolvido || "");
      setForwardDestination(selectedTicket.encaminhadoPara || "");
      setWorkspaceAnswerMsg(selectedTicket.respostaMsg || "");
    } else {
      setResolutionObs("");
      setForwardDestination("");
      setWorkspaceAnswerMsg("");
    }
  }, [selectedTicket]);

  // Helper alerts
  const triggerToast = (text: string, success: boolean = true) => {
    setToastMessage({ text, success });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Sign up citizens account action
  const handleRegisterCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: regNome,
          email: regEmail,
          telefone: regTelefone,
          password: regSenha,
          endereco: regEndereco,
          bairro: regBairro,
          cpf: regCpf
        })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast("Seu cadastro de cidadão foi criado com sucesso!");
        setShowCadastroModal(false);
        // Clear forms
        setRegNome(""); setRegEmail(""); setRegTelefone(""); setRegSenha(""); setRegEndereco(""); setRegCpf("");
        // Auto Login
        setCurrentUser(data.user);
      } else {
        triggerToast(data.message || "Falha ao criar cadastro.", false);
      }
    } catch {
      triggerToast("Erro de conexão.", false);
    }
  };

  // 2. Sign In action
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: loginIdentifier, password: loginPassword })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast(`Bem-vindo, ${data.user.nome}!`);
        setCurrentUser(data.user);
        setShowLoginModal(false);
        setLoginIdentifier("");
        setLoginPassword("");

        // Check if require password shift immediately (loginProvisorio)
        if (data.user.loginProvisorio) {
          setShowPasswordRenew(true);
        }
      } else {
        triggerToast(data.message || "Usuário ou senha incorretos.", false);
      }
    } catch {
      triggerToast("Erro de rede ao logar.", false);
    }
  };

  // 3. Renew first temporary password required
  const handlePasswordRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewPasswordInput) return;
    try {
      const response = await fetch("/api/auth/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, novaSenha: renewPasswordInput })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast("Sua senha provisória foi atualizada para a senha definitiva!");
        setShowPasswordRenew(false);
        setRenewPasswordInput("");
        // Reload login settings
        if (currentUser) {
          setCurrentUser({ ...currentUser, loginProvisorio: false });
        }
      }
    } catch {
      triggerToast("Falha técnica.", false);
    }
  };

  // 4. Recover credentials route triggers demo response
  const handleRecoverCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput) return;
    try {
      const response = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: recoveryInput })
      });
      const data = await response.json();
      if (data.success) {
        // Prompt dialog
        alert(data.message);
        setShowRecuperarModal(false);
        setRecoveryInput("");
      } else {
        triggerToast(data.message, false);
      }
    } catch {
      triggerToast("Erro de conexão.", false);
    }
  };

  const handleClearAll = () => {
    setTipoInput(ManifestacaoTipo.RECLAMACAO);
    setDescricaoInput("");
    setVereadorTarget("todos");
    setBairroInput("Centro");
    setConsentLgpd(false);
    setFotoUrlInput(null);
    setUseGpsGeoInput(false);
    setAnonymousReporter(false);
    triggerToast("Formulário limpo com sucesso!");
  };

  const executeSubmitManifestacao = async () => {
    const payload = {
      tipo: tipoInput,
      descricao: descricaoInput,
      vereadorId: vereadorTarget,
      usuarioId: anonymousReporter ? null : (currentUser?.id || null),
      usuarioNome: anonymousReporter ? "Anônimo (Protegido por Lei)" : (currentUser?.nome || "Cidadão Visitante"),
      usuarioEmail: anonymousReporter ? "anonimo@camara.gov.br" : (currentUser?.email || "anonimo@camara.gov.br"),
      usuarioTelefone: anonymousReporter ? "" : (currentUser?.telefone || ""),
      bairro: bairroInput,
      fotoUrl: fotoUrlInput,
      localizacao: useGpsGeoInput ? {
        latitude: -23.5505 + (Math.random() * 0.02 - 0.01),
        longitude: -46.6333 + (Math.random() * 0.02 - 0.01),
        bairro: bairroInput
      } : undefined
    };

    try {
      const res = await fetch("/api/manifestacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setOpenTicketFeedback(data.manifestacao);
        // Reset inputs
        setDescricaoInput("");
        setFotoUrlInput(null);
        setConsentLgpd(false);
        setUseGpsGeoInput(false);
        setAnonymousReporter(false);
        // Sinc
        fetchData();
        triggerToast("Sua manifestação foi cadastrada com classificação de IA!");
      }
    } catch {
      triggerToast("Erro ao abrir manifestação.", false);
    }
  };

  // 5. Submit Citizen Complaint Form (LGPD protection active)
  const handleCreateManifestacao = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricaoInput.trim()) {
      triggerToast("Escreva a descrição do seu relato.", false);
      return;
    }

    if (!consentLgpd) {
      triggerToast("É obrigatório aceitar o consentimento de tratamento de dados (LGPD) para prosseguir.", false);
      return;
    }

    // Direct user to log in or register before submitting, asking if they still want to send
    if (!currentUser) {
      setAuthOfferStep("choose");
      setShowAuthOfferModal(true);
      return;
    }

    await executeSubmitManifestacao();
  };

  // 6. Search dynamic timeline by protocol ID
  const handleSearchProtocolo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchProtocolo) return;
    const cleanP = searchProtocolo.trim().toUpperCase();
    const found = manifestacoes.find(m => m.protocolo.toUpperCase() === cleanP);
    if (found) {
      setSearchResult(found);
    } else {
      setSearchResult(null);
      triggerToast("Protocolo não localizado na base parlamentar de Ouvidoria.", false);
    }
  };

  // 7. Admin Workspace Action: Mark as Read (Starts SLA countdown, alerts and notifies user)
  const handleMarkAsRead = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/manifestacoes/${ticketId}/lido`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.manifestacao);
        fetchData();
        triggerToast("O chamado foi marcado como Lido. O cronômetro de 30 dias para resposta foi ativado!");
      }
    } catch {
      triggerToast("Erro técnico.", false);
    }
  };

  // 8. Admin Workspace Action: Send Response (ends SLA tracker, returns color to normal, deletes after 60d)
  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !workspaceAnswerMsg.trim()) return;

    try {
      const res = await fetch(`/api/manifestacoes/${selectedTicket.id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respostaMsg: workspaceAnswerMsg,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceAnswerMsg("");
        setSelectedTicket(data.manifestacao);
        fetchData();
        triggerToast("A resposta oficial foi encaminhada ao munícipe! SLA concluído.");
      }
    } catch {
      triggerToast("Erro ao processar resposta.", false);
    }
  };

  // Complete resolution handler for Vereador / Cabinet with observations and forwarding destinations
  const handleCompleteResolution = async (status: string, observacao: string, encaminhado: string, resposta: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/manifestacoes/${selectedTicket.id}/resolver-completo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          observacaoResolvido: observacao,
          encaminhadoPara: encaminhado,
          respostaMsg: resposta,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.manifestacao);
        fetchData();
        triggerToast("Ficha de resolução e observações salvas de forma auditada!");
      } else {
        const err = await res.json();
        triggerToast(err.message || "Erro ao salvar.", false);
      }
    } catch {
      triggerToast("Erro de rede.", false);
    }
  };

  // 9. Admin Workspace Action: Reassign competent Secretaria
  const handleForwardToSecretaria = async () => {
    if (!selectedTicket || !forwardSecId) return;
    try {
      const res = await fetch(`/api/manifestacoes/${selectedTicket.id}/encaminhar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretariaId: forwardSecId,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.manifestacao);
        setForwardSecId("");
        fetchData();
        triggerToast("Encaminhamento efetuado com sucesso!");
      }
    } catch {
      triggerToast("Erro de rede.", false);
    }
  };

  // 10. Admin Workspace Action: Reclassify priority / sub-category
  const handleReclassifyTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/manifestacoes/${selectedTicket.id}/reclassificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: reclassCategory,
          prioridade: reclassPriority,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.manifestacao);
        fetchData();
        triggerToast("Ficha de categoria e métrica reclassificados por IA/Humano!");
      }
    } catch {
      triggerToast("Erro ao reclassificar.", false);
    }
  };

  // 11. Custom Admin addition: Create a new user (with required temporary shift)
  // Remember restriction: Admins can list and manage ONLY users created by them!
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserNome || !addUserEmail || !addUserTelefone) return;

    // Validate alternative email is supplied for admin/agents
    if (!addUserEmailAlternativo || !addUserEmailAlternativo.trim()) {
      triggerToast("Erro: O E-mail Alternativo é OBRIGATÓRIO para todos os agentes legislativos para fins de cópia de segurança comprobatória.", false);
      return;
    }

    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUserId || undefined,
          nome: addUserNome,
          email: addUserEmail,
          telefone: addUserTelefone,
          senhaHash: addUserSenha || undefined,
          perfil: addUserPerfil,
          cargo: addUserCargoNome,
          adminId: currentUser?.id,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome,
          emailAlternativo: addUserEmailAlternativo
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (editingUserId) {
          triggerToast(`Conta de ${addUserNome} foi atualizada com sucesso.`);
        } else {
          triggerToast(`Conta criada para: ${addUserNome}. Provisória: '${addUserSenha}'`);
        }
        setShowUserAddModal(false);
        // clear inputs
        setAddUserNome(""); setAddUserEmail(""); setAddUserTelefone(""); setAddUserSenha("mudar123"); setAddUserCargoNome("");
        setAddUserEmailAlternativo("");
        setEditingUserId(null);
        fetchData();
      } else {
        triggerToast(data.message || "Erro ao registrar.", false);
      }
    } catch {
      triggerToast("Erro de rede.", false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const doubleCheck = window.confirm("Deseja realmente remover esta credencial? Esta operação é definitiva perante a LGPD.");
    if (!doubleCheck) return;

    try {
      const res = await fetch(`/api/usuarios/${userId}?adminEmail=${encodeURIComponent(currentUser?.email || "")}&adminNome=${encodeURIComponent(currentUser?.nome || "")}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Usuário removido da base de forma segura.");
        fetchData();
      }
    } catch {
      triggerToast("Falha ao apagar.", false);
    }
  };

  const handleBatchAction = async () => {
    if (selectedTicketIds.length === 0) {
      triggerToast("Nenhum chamado selecionado.", false);
      return;
    }
    
    if (batchAcao !== "excluir" && !batchDestino.trim()) {
      triggerToast("Digite ou selecione o setor, pessoa ou destinatário responsável.", false);
      return;
    }

    if (batchAcao === "excluir") {
      const confirmExclusao = window.confirm(`Deseja mesmo excluir PERMANENTEMENTE as ${selectedTicketIds.length} mensagens selecionadas? Esta ação é irreversível.`);
      if (!confirmExclusao) return;
    }

    setIsExecutingBatch(true);
    try {
      const res = await fetch("/api/ouvidoria/acao-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedTicketIds,
          acao: batchAcao,
          destino: batchDestino,
          usuarioNome: currentUser?.nome,
          usuarioEmail: currentUser?.email
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Ação em lote realizada com sucesso!", true);
        setSelectedTicketIds([]);
        setBatchDestino("");
        fetchData();
      } else {
        triggerToast(data.message || "Erro na ação em lote.", false);
      }
    } catch {
      triggerToast("Erro de rede ao processar lote.", false);
    } finally {
      setIsExecutingBatch(false);
    }
  };

  const handleImproveDispatchWithIA = async () => {
    if (!dispatchDespachoText.trim()) {
      triggerToast("Digite um rascunho de despacho primeiro para que a IA possa melhorá-lo.", false);
      return;
    }
    // Collect context references
    let contextText = "";
    if (selectedTicketIds.length === 1) {
      const tgt = manifestacoes.find(m => m.id === selectedTicketIds[0]);
      if (tgt) contextText = tgt.descricao;
    } else {
      const tgts = manifestacoes.filter(m => selectedTicketIds.includes(m.id));
      contextText = tgts.map(t => `[Protocolo ${t.protocolo}]: ${t.descricao}`).join("\n");
    }

    setIsImprovingDispatch(true);
    try {
      const res = await fetch("/api/despacho/melhorar-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rascunho: dispatchDespachoText, manifestacaoTexto: contextText })
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchDespachoText(data.textoMelhorado);
        triggerToast("Despacho aprimorado e corrigido pela Inteligência Artificial!");
      } else {
        const err = await res.json();
        triggerToast(err.message || "Erro de IA.", false);
      }
    } catch {
      triggerToast("Erro de rede ao conectar com a IA.", false);
    } finally {
      setIsImprovingDispatch(false);
    }
  };

  const handleSubmitDespachoOficial = async () => {
    if (selectedTicketIds.length === 0) {
      triggerToast("Selecione pelo menos uma mensagem ou relato.", false);
      return;
    }
    if (!dispatchResponsavelId) {
      triggerToast("Por favor, selecione a pessoa responsável pelo despacho.", false);
      return;
    }
    if (!dispatchDespachoText.trim()) {
      triggerToast("Por favor, digite o recado de despacho.", false);
      return;
    }

    setIsSubmittingDispatch(true);
    try {
      const res = await fetch("/api/manifestacoes/despachar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedTicketIds,
          responsavelId: dispatchResponsavelId,
          despachoText: dispatchDespachoText,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Populate proof certificate
        setDispatchProofResult({
          copiedSender: data.copiedSender,
          copiedReceiver: data.copiedReceiver,
          proofLogs: data.proofLogs
        });

        triggerToast("Mensagens despachadas e comprovadas com sucesso!");
        
        // Reset states
        setDispatchResponsavelId("");
        setDispatchDespachoText("");
        setSelectedTicketIds([]);
        if (selectedTicket && selectedTicketIds.includes(selectedTicket.id)) {
          setSelectedTicket(null);
        }
        fetchData();
      } else {
        const err = await res.json();
        triggerToast(err.message || "Erro ao processar despacho.", false);
      }
    } catch {
      triggerToast("Erro de rede ao enviar despacho.", false);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleCreateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCargoNome.trim()) {
      triggerToast("Por favor, preencha o nome do cargo.", false);
      return;
    }
    try {
      const res = await fetch("/api/cargos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCargoId || undefined,
          nome: addCargoNome,
          descricao: addCargoDescricao,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (res.ok) {
        if (editingCargoId) {
          triggerToast(`Cargo "${addCargoNome}" atualizado com sucesso!`);
        } else {
          triggerToast(`Novo cargo "${addCargoNome}" cadastrado com sucesso!`);
        }
        setAddCargoNome("");
        setAddCargoDescricao("");
        setEditingCargoId(null);
        fetchData();
      } else {
        const err = await res.json();
        triggerToast(err.message || "Erro ao processar cargo.", false);
      }
    } catch {
      triggerToast("Erro de rede ao processar cargo.", false);
    }
  };

  const handleDeleteCargo = async (cargoId: string) => {
    const doubleCheck = window.confirm("Deseja realmente excluir este cargo?");
    if (!doubleCheck) return;
    try {
      const res = await fetch(`/api/cargos/${cargoId}?adminEmail=${encodeURIComponent(currentUser?.email || "")}&adminNome=${encodeURIComponent(currentUser?.nome || "")}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Cargo excluído com sucesso.");
        fetchData();
      } else {
        const err = await res.json();
        triggerToast(err.message || "Erro ao excluir cargo.", false);
      }
    } catch {
      triggerToast("Erro ao excluir cargo.", false);
    }
  };

  // 12. Custom Admin addition: Create/Update Secretarias
  const handleCreateSecretaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSecNome || !addSecEmail || !addSecResp) return;

    try {
      const response = await fetch("/api/secretarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSecId || undefined,
          nome: addSecNome,
          email: addSecEmail,
          responsavelNome: addSecResp,
          adminEmail: currentUser?.email,
          adminNome: currentUser?.nome
        })
      });
      if (response.ok) {
        if (editingSecId) {
          triggerToast(`Gabinete/Vereador "${addSecNome}" atualizado com sucesso.`);
        } else {
          triggerToast(`Nova secretaria municipal adicionada: ${addSecNome}`);
        }
        setShowSecAddModal(false);
        setAddSecNome(""); setAddSecEmail(""); setAddSecResp("");
        setEditingSecId(null);
        fetchData();
      }
    } catch {
      triggerToast("Erro ao processar requisição.", false);
    }
  };

  const handleDeleteSecretaria = async (secId: string) => {
    const ask = window.confirm("Excluir esta secretaria? Manifestações vinculadas serão redistribuídas.");
    if (!ask) return;

    try {
      const res = await fetch(`/api/secretarias/${secId}?adminEmail=${encodeURIComponent(currentUser?.email || "")}&adminNome=${encodeURIComponent(currentUser?.nome || "")}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Secretaria municipal excluída com sucesso.");
        fetchData();
      }
    } catch {
      triggerToast("Erro técnico de exclusão.", false);
    }
  };

  // Logout reset
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTicket(null);
    triggerToast("Sessão finalizada de forma segura. Dados pessoais criptografados.");
  };

  // Logo click reset
  const handleLogoClick = () => {
    setActiveTab("cidadao");
    setCidadaoSubTab("inicio");
    setSelectedTicket(null);
    setSearchResult(null);
    setSearchProtocolo("");
  };

  // Excel (CSV) Download
  const handleDownloadExcel = (ticket: Manifestacao) => {
    const csvContent = [
      ["Protocolo", "Tipo", "Categoria", "Descricao", "Status", "Prioridade", "Bairro", "Criado Em", "Respondido Em", "Resposta Legislativa"],
      [
        ticket.protocolo,
        ticket.tipo,
        ticket.categoria,
        ticket.descricao.replace(/\n/g, " "),
        ticket.status,
        ticket.prioridade,
        ticket.bairro,
        ticket.criadoEm,
        ticket.respondidoEm || "N/A",
        (ticket.respostaMsg || "").replace(/\n/g, " ")
      ]
    ].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_protocolo_${ticket.protocolo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Planilha de protocolo exportada com sucesso!");
  };

  // PDF / Printable Mock View
  const handleDownloadPDFMock = (ticket: Manifestacao) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      triggerToast("Por favor, permita pop-ups para imprimir o relatório.", false);
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Oficial de Protocolo - ${ticket.protocolo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #024a30; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 800; color: #024a30; margin: 5px 0; font-family: 'Space Grotesk', sans-serif; }
          .subtitle { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .meta-item { font-size: 13px; }
          .meta-item strong { color: #0f172a; }
          .content-section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; color: #334155; }
          .text-content { font-size: 13px; background: #fafafa; border-left: 4px solid #024a30; padding: 15px; border-radius: 4px; white-space: pre-wrap; color: #334155; }
          .status-badge { display: inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 9999px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
          .history-logs { list-style: none; padding-left: 15px; }
          .history-logs li { font-size: 12px; margin-bottom: 8px; position: relative; padding-left: 15px; color: #475569; }
          .history-logs li::before { content: "•"; color: #024a30; font-weight: bold; position: absolute; left: 0; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .stamps { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
          .stamp-box { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="subtitle">Ouvidoria Legislativa de Câmara Municipal</div>
          <div class="title">RELATÓRIO CERTIFICADO DE RELATO PARLAMENTAR</div>
          <div style="font-size: 12px; margin-top: 5px;">Código Transparente: <strong>${ticket.protocolo}</strong></div>
        </div>

        <div class="meta-box">
          <div class="meta-item"><strong>Cidadão Autor:</strong> ${ticket.usuarioNome || "Anônimo (Termos LGPD)"}</div>
          <div class="meta-item"><strong>Registrado em:</strong> ${new Date(ticket.criadoEm).toLocaleString()}</div>
          <div class="meta-item"><strong>Tipo de Manifestação:</strong> ${ticket.tipo}</div>
          <div class="meta-item"><strong>Categoria Triagem IA:</strong> ${ticket.categoria}</div>
          <div class="meta-item"><strong>Bairro Mapeado (Setor):</strong> ${ticket.bairro}</div>
          <div class="meta-item"><strong>Nível de Prioridade:</strong> ${ticket.prioridade}</div>
          <div class="meta-item" style="grid-column: span 2;">
            <strong>Status de Resolução:</strong> 
            <span class="status-badge">${ticket.status}</span>
          </div>
        </div>

        <div class="content-section">
          <div class="section-title">Descrição do Relato do Munícipe</div>
          <div class="text-content">${ticket.descricao}</div>
        </div>

        ${ticket.respostaMsg ? `
          <div class="content-section">
            <div class="section-title">Resposta Oficial do Gabinete Legislativo</div>
            <div class="text-content" style="background: #f0fdf4; border-left-color: #10b981; color: #065f46;">${ticket.respostaMsg}</div>
          </div>
        ` : ""}

        <div class="content-section">
          <div class="section-title">Histórico de Trâmite de Auditoria (Normas LGPD)</div>
          <ul class="history-logs">
            ${ticket.historicoLogs.map(log => `<li>${log}</li>`).join("")}
          </ul>
        </div>

        <div class="stamps">
          <div class="stamp-box">
            Assinatura Responsável<br />
            <strong>Ouvidoria de Câmara Municipal</strong>
          </div>
          <div class="stamp-box">
            Assinatura Autor<br />
            <strong>${ticket.usuarioNome || "Anônimo"}</strong>
          </div>
        </div>

        <div class="footer">
          Conforme a Lei Geral de Proteção de Dados (LGPD) nº 13.709/2018. Documento digitalizado emitido pelo sistema OuviVereador Inteligente.<br />
          Para autenticar este documento, consulte o protocolo no portal oficial da Câmara Municipal.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    triggerToast("Modo de impressão ativado!");
  };

  // Confirm and simulate send email report API call
  const handleConfirmSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForEmail) return;

    if (!emailDestinatarioLocal.trim()) {
      triggerToast("Por favor, informe o e-mail destinatário.", false);
      return;
    }

    setIsSendingEmail(true);

    try {
      const res = await fetch(`/api/manifestacoes/${ticketForEmail.id}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailDestinatario: emailDestinatarioLocal,
          usuarioNome: currentUser?.nome || "Cidadão Visitante",
          usuarioEmail: currentUser?.email || "cidadao@camara.gov.br"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Cópia enviada de forma segura para ${emailDestinatarioLocal}!`);
        setShowEmailModal(false);
        setTicketForEmail(null);
        fetchData(); // Sinc timeline change immediately
      } else {
        triggerToast(data.message || "Falha técnica ao enviar e-mail.", false);
      }
    } catch {
      triggerToast("Erro técnico de comunicação de e-mail.", false);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Transmite o relatório consolidado gerado no filtro de Ouvidoria por e-mail e audita a atividade na LGPD
  const handleSendGlobalReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportEmailDestination.trim()) {
      triggerToast("Por favor, informe o e-mail destinatário.", false);
      return;
    }

    setIsSendingGlobalReport(true);

    const ticketsToUse = selectedTicketIds.length > 0 
      ? filteredAdminTickets.filter(t => selectedTicketIds.includes(t.id)) 
      : filteredAdminTickets;

    try {
      const res = await fetch("/api/ouvidoria/enviar-relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailDestinatario: reportEmailDestination,
          usuarioNome: currentUser?.nome || "Ouvidor de Câmara",
          usuarioEmail: currentUser?.email || "ouvidoria@camara.gov.br",
          filtros: {
            bairro: adminFilterBairro,
            prioridade: adminFilterPrioridade,
            status: adminFilterStatus,
            secretariaId: adminFilterSec,
            dateFrom: adminFilterDateFrom,
            dateTo: adminFilterDateTo,
            assunto: adminFilterAssunto,
            orgao: adminFilterOrgao,
            apenasMarcadas: selectedTicketIds.length > 0
          },
          ticketCount: ticketsToUse.length,
          ticketSummary: ticketsToUse.slice(0, 50).map(t => ({
            protocolo: t.protocolo,
            tipo: t.tipo,
            categoria: t.categoria,
            bairro: t.bairro,
            status: t.status,
            criadoEm: t.criadoEm,
            encaminhadoPara: t.encaminhadoPara || ""
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Relatório oficial enviado de forma segura!");
        setShowGlobalReportModal(false);
        setReportEmailDestination("");
      } else {
        triggerToast(data.message || "Erro técnico ao transmitir relatório.", false);
      }
    } catch {
      triggerToast("Erro técnico de comunicação de rede.", false);
    } finally {
      setIsSendingGlobalReport(false);
    }
  };

  // --- SLA CALCULATOR WITH VISUAL COLORED WARNING SYSTEM ---
  // "O responsável que leu terá prazo de 30 dias para responder. Enquanto não responder a mensagem fica na tela do histórico e muda de cor para laranja quando chegar em 15 a 24 dias e ficará vermelho a partir de 25 dias."
  const getTicketSLAlert = (ticket: Manifestacao) => {
    if (ticket.status !== "Lido (Aguardando Resposta)" || !ticket.lidoEm) {
      return { label: "SLA Normal", colorClass: "text-slate-600 bg-slate-100 border-slate-200" };
    }

    const readDate = new Date(ticket.lidoEm);
    const diffTime = Math.abs(SYSTEM_PRESENT_DATE.getTime() - readDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 25) {
      return { 
        label: `🚨 Crítico (${diffDays}/30 dias)`, 
        colorClass: "bg-red-50 text-red-700 border-red-250 animate-pulse",
        rowClass: "bg-red-50/70 hover:bg-red-100/50 border-l-4 border-l-red-500"
      };
    } else if (diffDays >= 15 && diffDays <= 24) {
      return { 
        label: `⚠️ Alerta (${diffDays}/30 dias)`, 
        colorClass: "bg-amber-50 text-amber-700 border-amber-250",
        rowClass: "bg-amber-50/70 hover:bg-amber-100/50 border-l-4 border-l-amber-500"
      };
    } else {
      return { 
        label: `✓ Em dia (${diffDays}/30 dias)`, 
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-250",
        rowClass: "hover:bg-slate-50 border-l-4 border-l-emerald-400"
      };
    }
  };

  // Pre-filtered List representation for Admin Grid
  const filteredAdminTickets = useMemo(() => {
    return manifestacoes.filter((m) => {
      if (adminFilterBairro !== "todos" && m.bairro !== adminFilterBairro) return false;
      if (adminFilterPrioridade !== "todos" && m.prioridade !== adminFilterPrioridade) return false;
      if (adminFilterStatus !== "todos" && m.status !== adminFilterStatus) return false;
      if (adminFilterSec !== "todos" && m.secretariaId !== adminFilterSec) return false;
      if (adminFilterAssunto) {
        const query = adminFilterAssunto.toLowerCase();
        const matchesTipoBuf = (m.tipo || "").toLowerCase().includes(query);
        const matchesCatBuf = (m.categoria || "").toLowerCase().includes(query);
        const matchesDescBuf = (m.descricao || "").toLowerCase().includes(query);
        const matchesProtocoloBuf = (m.protocolo || "").toLowerCase().includes(query);
        if (!matchesTipoBuf && !matchesCatBuf && !matchesDescBuf && !matchesProtocoloBuf) return false;
      }
      if (adminFilterOrgao) {
        const query = adminFilterOrgao.toLowerCase();
        const matchesOrgaoBuf = (m.encaminhadoPara || "").toLowerCase().includes(query);
        if (!matchesOrgaoBuf) return false;
      }
      if (adminFilterDateFrom) {
        const fromDate = new Date(adminFilterDateFrom);
        const ticketDate = new Date(m.criadoEm);
        ticketDate.setHours(0,0,0,0);
        fromDate.setHours(0,0,0,0);
        if (ticketDate < fromDate) return false;
      }
      if (adminFilterDateTo) {
        const toDate = new Date(adminFilterDateTo);
        const ticketDate = new Date(m.criadoEm);
        ticketDate.setHours(23,59,59,999);
        toDate.setHours(23,59,59,999);
        if (ticketDate > toDate) return false;
      }
      if (adminFilterEmail) {
        const query = adminFilterEmail.toLowerCase();
        const matchesEmailBuf = (m.usuarioEmail || "").toLowerCase().includes(query);
        if (!matchesEmailBuf) return false;
      }
      if (adminFilterAlerta !== "todos") {
        const alertObj = getTicketSLAlert(m);
        const labelStr = (alertObj?.label || "").toLowerCase();
        if (adminFilterAlerta === "critico" && !labelStr.includes("crítico")) return false;
        if (adminFilterAlerta === "alerta" && !labelStr.includes("alerta")) return false;
        if (adminFilterAlerta === "emdia" && !labelStr.includes("dia")) return false;
      }
      if (adminFilterMarcadasOnly) {
        if (!selectedTicketIds.includes(m.id)) return false;
      }
      return true;
    });
  }, [
    manifestacoes, 
    adminFilterBairro, 
    adminFilterPrioridade, 
    adminFilterStatus, 
    adminFilterSec, 
    adminFilterDateFrom, 
    adminFilterDateTo, 
    adminFilterAssunto, 
    adminFilterOrgao,
    adminFilterEmail,
    adminFilterAlerta,
    adminFilterMarcadasOnly,
    selectedTicketIds
  ]);

  // Statistics summaries counters (real time metrics calculated from actual state)
  const statsCounters = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const hojeCount = manifestacoes.filter(m => m.criadoEm.startsWith(todayStr)).length;
    const pendentesCount = manifestacoes.filter(m => m.status !== "Respondido" && m.status !== "Finalizado").length;
    const resolvidosCount = manifestacoes.filter(m => m.status === "Respondido").length;
    
    // SLA warning urgent indicators
    const urgentesCount = manifestacoes.filter(m => {
      const alert = getTicketSLAlert(m);
      return alert.label && alert.label.includes("Crítico");
    }).length;

    // Real-time resolution average duration computed from existing responses
    const resolvedm = manifestacoes.filter(m => m.status === "Respondido" && m.respondidoEm && m.criadoEm);
    let tempoMedio = "N/A (Sem registros)";
    if (resolvedm.length > 0) {
      const sumMs = resolvedm.reduce((acc, m) => {
        const diff = new Date(m.respondidoEm!).getTime() - new Date(m.criadoEm).getTime();
        return acc + diff;
      }, 0);
      const avgDays = (sumMs / resolvedm.length) / (1000 * 60 * 60 * 24);
      tempoMedio = `${avgDays.toFixed(1)} ${avgDays === 1 ? "dia" : "dias"}`;
    }

    return {
      hoje: hojeCount,
      pendentes: pendentesCount,
      resolvidos: resolvidosCount,
      urgentes: urgentesCount,
      tempoMedio: tempoMedio
    };
  }, [manifestacoes]);

  // Simulated and real exports downloads matching dynamic filters
  const handleSimulateExport = (format: "pdf" | "excel" | "csv") => {
    const ticketsToUse = selectedTicketIds.length > 0 
      ? filteredAdminTickets.filter(t => selectedTicketIds.includes(t.id)) 
      : filteredAdminTickets;

    triggerToast(`Preparando arquivo de relatório consolidado para download... ${ticketsToUse.length} registros.`);
    
    // Create actual CSV content based on current filters! Excel compatible semicolon-delimited CSV with UTF-8 BOM
    const headers = ["Protocolo", "Data Criacao", "Tipo", "Categoria", "Descricao", "Status", "Prioridade", "Bairro / Setor", "Responsavel (Secretaria)", "Encaminhado Para", "Observacao Resolvido", "Resposta Oficial"];
    const rows = ticketsToUse.map(t => [
      t.protocolo,
      new Date(t.criadoEm).toLocaleDateString(),
      t.tipo,
      t.categoria,
      t.descricao.replace(/[\n\r]/g, " "),
      t.status,
      t.prioridade,
      t.bairro,
      secretarias.find(s => s.id === t.secretariaId)?.nome || "Geral",
      t.encaminhadoPara || "",
      t.observacaoResolvido || "",
      (t.respostaMsg || "").replace(/[\n\r]/g, " ")
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.map(v => `"${(v || "").toString().replace(/"/g, '""')}"`).join(";"))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Ouvidoria_Filtrado_${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "csv" : "csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      triggerToast(`Sucesso! Relatório consolidado com ${ticketsToUse.length} mensagens baixado com os filtros!`, true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800" id="application-root-container">
      
      {/* Toast Alert floating */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-bounce transition-all ${
          toastMessage.success ? "bg-emerald-800 border-emerald-600 text-white" : "bg-rose-800 border-rose-600 text-white"
        }`}>
          {toastMessage.success ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <AlertTriangle className="w-5 h-5 text-rose-300" />}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER SECTION INJECTING DYNAMIC VISUAL MUNICIPAL BANNER */}
      <Header config={headerConfig} onLogoClick={handleLogoClick} />

      {/* SUB HEADER ACTIONS (Auth and Mode selectors) */}
      <div className="bg-slate-900 border-b border-slate-950 px-4 py-3 flex flex-col md:flex-row items-center justify-between text-white gap-4">
        
        {/* Left side branding */}
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
          {headerConfig.appSubTitle ? (
            <span className="text-emerald-400">{headerConfig.appSubTitle}</span>
          ) : (
            <>
              <span className="font-semibold text-emerald-400">Atendimento ao Cidadão</span>
              <span>•</span>
              <span className="text-slate-400">Legislativo Municipal</span>
            </>
          )}
        </div>

        {/* Global User Authentication Quick Links right screen bar */}
        <div className="flex items-center justify-center gap-3 w-full md:w-auto">
          {currentUser ? (
            <div className="flex items-center justify-between md:justify-end gap-3 text-slate-200 w-full md:w-auto">
              <div className="text-left md:text-right">
                <span className="text-xs block font-bold text-slate-100">{currentUser.nome}</span>
                <span className="text-[10px] text-emerald-400 font-bold tracking-wider">{currentUser.perfil}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300 hover:text-rose-400 transition cursor-pointer"
                title="Sair de forma segura"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full md:w-auto sm:flex sm:items-center">
              <button
                onClick={() => { setShowCadastroModal(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
                id="btn-trigger-signup-form"
              >
                Cadastro
              </button>
              <button
                onClick={() => { setShowLoginModal(true); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                id="btn-trigger-signin-form"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar (Login)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CORE DISPLAY WINDOW */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">
        
        {/* ======================================= */}
        {/* I. CITIZEN MODE SUB-INTERFACE           */}
        {/* ======================================= */}
        {activeTab === "cidadao" && (
          <div className="space-y-6 animate-fade-in" id="citizen-portal-view">
            
            {/* Tab sub selector */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl self-start gap-1 max-w-xl shadow-inner border border-slate-200/60" id="tab-btns-container">
              <button
                onClick={() => setCidadaoSubTab("inicio")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cidadaoSubTab === "inicio" ? "bg-[#0b2545] text-white shadow-md font-extrabold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
                }`}
                id="tab-btn-inicio"
              >
                <span>🏡 Início</span>
              </button>

              <button
                onClick={() => setCidadaoSubTab("abrir")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cidadaoSubTab === "abrir" ? "bg-[#0b2545] text-white shadow-md font-extrabold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
                }`}
                id="tab-btn-nova-manifestacao"
              >
                <span>📝 Nova Manifestação</span>
              </button>

              <button
                onClick={() => setCidadaoSubTab("consultar")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cidadaoSubTab === "consultar" ? "bg-[#0b2545] text-white shadow-md font-extrabold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
                }`}
                id="tab-btn-consultar-protocolo"
              >
                <span>🔍 Consultar Protocolo</span>
              </button>
            </div>

            {/* ESPAÇO DE PUBLICIDADE SUPERIOR (CAROUSEL DE ANÚNCIOS INSTITUCIONAIS DINÂMICOS COLETADOS DO SERVIDOR) */}
            {publicidadesTop && publicidadesTop.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-4 rounded-xl shadow-sm font-sans text-left animate-fade-in" id="propaganda-legislativa-top">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-amber-600 text-white font-mono text-[8.5px] font-black uppercase px-2 py-0.5 rounded tracking-wider shrink-0 mt-0.5 shadow-sm">
                      Informativo Público
                    </span>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase block">
                        {publicidadesTop[currentAdIndex % publicidadesTop.length]?.category}
                      </span>
                      <h5 className="text-xs font-black text-slate-800 leading-normal">
                        {publicidadesTop[currentAdIndex % publicidadesTop.length]?.title}
                      </h5>
                      <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                        {publicidadesTop[currentAdIndex % publicidadesTop.length]?.highlight}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    {/* Discrete navigation controls */}
                    {publicidadesTop.length > 1 && (
                      <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-sm">
                        <button 
                          type="button"
                          onClick={() => setCurrentAdIndex(prev => (prev === 0 ? publicidadesTop.length - 1 : prev - 1))}
                          className="p-1 px-2 bg-white hover:bg-slate-50 border-r text-slate-600 active:text-amber-700 transition cursor-pointer"
                          title="Publicidade Anterior"
                        >
                          <ArrowLeft className="w-3 h-3 text-slate-500 hover:text-amber-700" />
                        </button>
                        <span className="px-2 text-[10px] font-extrabold text-slate-500 font-mono bg-slate-50">
                          {Math.min(currentAdIndex + 1, publicidadesTop.length)}/{publicidadesTop.length}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setCurrentAdIndex(prev => (prev === publicidadesTop.length - 1 ? 0 : prev + 1))}
                          className="p-1 px-2 bg-white hover:bg-slate-50 text-slate-600 active:text-amber-700 transition cursor-pointer"
                          title="Próxima Publicidade"
                        >
                          <ArrowRight className="w-3 h-3 text-slate-500 hover:text-amber-700" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveAdDetail(publicidadesTop[currentAdIndex % publicidadesTop.length])}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition cursor-pointer max-h-[34px] flex items-center"
                    >
                      Saiba Mais...
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Sub-tab 0: Início Landing Page matching user screenshots */}
            {cidadaoSubTab === "inicio" && (
              <div className="flex flex-col items-center text-center space-y-6 py-6 pr-1 pl-1 max-w-2xl mx-auto animate-fade-in" id="welcome-citizen-home">
                {/* Visual Identity Logo / Temple Icon */}
                <div className="flex flex-col items-center gap-2">
                  {headerConfig.logoUrl ? (
                    <img 
                      src={headerConfig.logoUrl} 
                      alt="Logo Oficial" 
                      className="h-28 w-28 rounded-full object-cover border-4 border-slate-200 shadow-lg bg-white" 
                    />
                  ) : (
                    <div className="text-6xl animate-bounce transform hover:scale-105 transition" style={{ animationDuration: '4s' }}>
                      🏛️
                    </div>
                  )}
                </div>

                {/* Inline customization spot only for the system Admin */}
                {currentUser?.perfil === UserPerfil.ADMIN && (
                  <div className="w-full bg-amber-50/80 border-2 border-dashed border-amber-300 rounded-2xl p-5 text-left space-y-4 shadow-sm animate-fade-in text-xs max-w-md mx-auto my-2" id="admin-inline-identity-editor">
                    <div className="flex items-center gap-1.5 border-b border-amber-200/80 pb-2">
                      <span className="bg-amber-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs">ADMINISTRADOR</span>
                      <h4 className="font-extrabold text-amber-950 uppercase text-[10px] tracking-wider">Identidade do Portal</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Logo file upload handler */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider block">
                          Alterar Logomarca Oficial (Upload)
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    triggerToast("A imagem deve ser menor que 2MB.", false);
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    const base64Str = uploadEvent.target?.result as string;
                                    setHeaderConfig(prev => ({ ...prev, logoUrl: base64Str }));
                                    triggerToast("Sucesso: Nova logo carregada! Clique no botão abaixo para Salvar.");
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 file:cursor-pointer"
                            />
                            <p className="text-[9px] text-slate-500 mt-1">
                              Carregue seu arquivo de logo municipal e salve para atualizar as views.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Welcome greeting phrase modifier */}
                      <div className="space-y-1.5 font-sans">
                        <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider block">
                          Frase de Boas-vindas Principal
                        </label>
                        <input 
                          type="text"
                          value={headerConfig.welcomeGreeting || ""}
                          onChange={(e) => setHeaderConfig({ ...headerConfig, welcomeGreeting: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium text-xs"
                          placeholder="Bem-vindo à Ouvidoria Câmara Municipal Alagoinhas/ BA"
                        />
                      </div>

                      {/* Subtitle / branding phrase modifier */}
                      <div className="space-y-1.5 font-sans">
                        <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider block">
                          Frase do Subtítulo (Branding Superior)
                        </label>
                        <input 
                          type="text"
                          value={headerConfig.appSubTitle || ""}
                          onChange={(e) => setHeaderConfig({ ...headerConfig, appSubTitle: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium text-xs"
                          placeholder="Atendimento ao Cidadão • Legislativo Municipal"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/header-config", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                municipioNome: headerConfig.municipioNome,
                                nomePrograma: headerConfig.nomePrograma,
                                logoUrl: headerConfig.logoUrl,
                                backgroundColor: headerConfig.backgroundColor,
                                welcomeGreeting: headerConfig.welcomeGreeting,
                                appSubTitle: headerConfig.appSubTitle
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setHeaderConfig(data.headerConfig);
                              triggerToast("Logomarca, Frase e Subtítulo salvos com sucesso!");
                            } else {
                              triggerToast("Erro ao salvar.", false);
                            }
                          } catch {
                            triggerToast("Falha ao salvar as configurações.", false);
                          }
                        }}
                        className="w-full bg-[#0b2545] hover:bg-slate-800 text-white font-extrabold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer shadow-sm text-center"
                      >
                        ✓ Salvar Nova Logomarca, Frase e Subtítulo
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-[#0b2545] tracking-tight whitespace-pre-line">
                    {headerConfig.welcomeGreeting || "Bem-vindo à Ouvidoria Câmara Municipal"}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
                    Sua voz importa. Fale com seu VEREADOR. Registre reclamações, sugestões, elogios e denúncias. Acompanhe o andamento pelo protocolo.
                  </p>
                </div>

                {/* Side-by-side interactive card buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full pt-4">
                  
                  <button
                    onClick={() => setCidadaoSubTab("abrir")}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500/30 p-6 rounded-2xl shadow-md transition-all text-left flex flex-col items-center sm:items-start text-center sm:text-left gap-3.5 group cursor-pointer"
                  >
                    <span className="text-4xl text-blue-600 font-bold group-hover:scale-110 transition duration-300">📝</span>
                    <div>
                      <h3 className="text-base font-black text-blue-700 tracking-tight group-hover:text-blue-850 transition">
                        Abrir Manifestação
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                        Registre reclamação, sugestão, elogio ou denúncia
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCidadaoSubTab("consultar")}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/30 p-6 rounded-2xl shadow-md transition-all text-left flex flex-col items-center sm:items-start text-center sm:text-left gap-3.5 group cursor-pointer"
                  >
                    <span className="text-4xl text-emerald-600 font-bold group-hover:scale-110 transition duration-300">🔍</span>
                    <div>
                      <h3 className="text-base font-black text-[#15803d] tracking-tight group-hover:text-emerald-800 transition">
                        Consultar Protocolo
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                        Acompanhe o andamento do seu chamado
                      </p>
                    </div>
                  </button>

                </div>

                {/* Security warning LGPD box */}
                <div className="w-full bg-[#0a2342] text-white p-5 rounded-2xl shadow-lg border border-blue-900/40 text-left flex items-start gap-4 mt-6 animate-scale-up">
                  <span className="text-2xl mt-0.5">🔒</span>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-sky-100 uppercase tracking-wider">
                      Seus dados estão protegidos
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Conforme a LGPD (Lei nº 13.709/2018). Seus dados são tratados com segurança e transparência.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* Sub-tab 1: Open Complaint Ticket */}
            {cidadaoSubTab === "abrir" && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setCidadaoSubTab("inicio")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer self-start w-fit"
                  id="btn-voltar-inicio-abrir"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Início</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Interactive Form Column */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleCreateManifestacao} className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-5" id="ticket-opening-form">
                    
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Formulário de Ouvidoria ao Legislativo — Rio Claro</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Tipo de Ocorrência</label>
                        <select
                          value={tipoInput}
                          onChange={(e) => setTipoInput(e.target.value as ManifestacaoTipo)}
                          className="px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium"
                        >
                          <option value={ManifestacaoTipo.RECLAMACAO}>Reclamação</option>
                          <option value={ManifestacaoTipo.SUGESTAO}>Sugestão</option>
                          <option value={ManifestacaoTipo.DENUNCIA}>Denúncia</option>
                          <option value={ManifestacaoTipo.ELOGIO}>Elogio</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Direcionar Para</label>
                        <select
                          value={vereadorTarget}
                          onChange={(e) => setVereadorTarget(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-800 font-bold"
                        >
                          <option value="todos">Todos os Vereadores (Geral)</option>
                          <option value="ouvidoria">Ouvidoria de Câmara Geral</option>
                          <option value="u-silva">Vereador Silva (Gabinete 309)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase font-mono">Bairro do Município</label>
                        <select
                          value={bairroInput}
                          onChange={(e) => setBairroInput(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium"
                        >
                          <option value="Centro">Centro</option>
                          <option value="Alagoinhas Velha">Alagoinhas Velha</option>
                          <option value="Silva Jardim">Silva Jardim</option>
                          <option value="Catu">Catu</option>
                          <option value="Santa Terezinha">Santa Terezinha</option>
                          <option value="Kennedy">Kennedy</option>
                          <option value="Barreiro">Barreiro</option>
                          <option value="Petrolar">Petrolar</option>
                          <option value="Juca de Rosa">Juca de Rosa</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 justify-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="use-gps-sim"
                            checked={useGpsGeoInput}
                            onChange={(e) => setUseGpsGeoInput(e.target.checked)}
                            className="w-4 h-4 cursor-pointer text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
                          />
                          <label htmlFor="use-gps-sim" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-rose-500" />
                            <span>Simular Geotag GPS (Opcional)</span>
                          </label>
                        </div>
                      </div>

                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase flex items-center justify-between">
                        <span>Descreva com clareza o problema</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Classificação por IA e Roteamento Ativos</span>
                      </label>
                      <textarea
                        value={descricaoInput}
                        onChange={(e) => setDescricaoInput(e.target.value)}
                        rows={4}
                        placeholder="Ex: Peço encarecidamente a coleta dos resíduos perto do colégio... ou Há lampadas quebradas na rua X, nº 22..."
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Selected Preset Image Display (Enviar Foto) - Placed after writing message and before LGPD/Anonymous */}
                    <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Enviar Foto</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Na versão instalável de celular (Android/iOS) você pode usar sua câmera de forma direta. No MVP, selecione abaixo uma imagem fictícia que represente o obstáculo municipal:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
                        {presetPhotos.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFotoUrlInput(p.url);
                              triggerToast("Foto vinculada ao seu relatório com sucesso!");
                            }}
                            className={`px-3 py-2 text-xs font-medium text-left rounded-lg border transition flex items-center justify-between cursor-pointer ${
                              fotoUrlInput === p.url ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span>{p.label}</span>
                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                      {fotoUrlInput && (
                        <div className="flex justify-between items-center bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-lg mt-2 font-medium">
                          <span className="text-xs text-emerald-800">Foto selecionada com sucesso!</span>
                          <button
                            type="button"
                            onClick={() => setFotoUrlInput(null)}
                            className="text-xs hover:underline text-rose-600 font-bold ml-2"
                          >
                            Remover foto anexada
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Anonymous disclaimer toggle */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is-anonimo-chk"
                          checked={anonymousReporter}
                          onChange={(e) => setAnonymousReporter(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <label htmlFor="is-anonimo-chk" className="text-xs font-bold text-slate-700">Desejo manifestar de forma Anônima</label>
                      </div>
                      <span className="text-[9px] text-slate-500 font-medium">Sua identidade física será ocultada no histórico</span>
                    </div>

                    {/* LGPD REQUIRED TERMS CHECKBOX */}
                    <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-lg space-y-3">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                        Termos e Consentimento Geral de Proteção de Dados (LGPD)
                      </span>
                      <p className="text-[10px] text-emerald-700 leading-relaxed pr-3">
                        Autorizo de livre e espontânea vontade o tratamento de meus dados pessoais básicos fornecidos (como e-mail, telefone e endereço mapeado) pela plataforma Ouvidoria Legislativa Inteligente, bem como o upload de fotos, arquivos correlatos e coordenadas de localização GPS de forma encriptada, para o fim exclusivo de andamento e processamento de minha queixa ou sugestão perante secretarias técnicas municipais competentes.
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="consent-lgpd-box"
                          required
                          checked={consentLgpd}
                          onChange={(e) => setConsentLgpd(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <label htmlFor="consent-lgpd-box" className="text-xs font-extrabold text-slate-800 cursor-pointer hover:underline decoration-emerald-500">
                          "Autorizo tratamento dos dados conforme LGPD." <span className="text-rose-600 font-bold">(Obrigatório) *</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2.5 pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition shadow cursor-pointer uppercase tracking-widest"
                      >
                        <Send className="w-4 h-4" />
                        <span>ENVIAR MENSAGEM</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs font-bold text-slate-550 hover:text-rose-600 hover:underline transition cursor-pointer"
                      >
                        Limpar tudo
                      </button>
                    </div>

                  </form>
                </div>

                {/* Visual Banner on portal */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-emerald-950 text-white rounded-xl p-6 shadow-md border border-emerald-900 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                      <Shield className="w-64 h-64 text-green-200" />
                    </div>
                    
                    <span className="bg-emerald-800 text-emerald-250 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest inline-block mb-3">Conformidade LGPD Autêntica</span>
                    <h3 className="text-lg font-bold tracking-tight mb-2">Seus dados pessoais salvaguardados com critério nobre</h3>
                    
                    <p className="text-xs text-emerald-100/90 leading-relaxed space-y-3 mb-4">
                      De acordo com as leis do Marco Regulatório e LGPD, nosso banco encripta cpf, telefone e dados sensíveis. O encerramento automático após 60 dias das soluções oficiais preserva o direito ao esquecimento e mitigação de vazamentos.
                    </p>

                    <div className="bg-emerald-900/60 p-3.5 rounded-lg text-[11px] border border-emerald-800 space-y-2">
                      <p className="font-bold flex items-center gap-1"><X className="w-3.5 h-3.5 text-rose-400" /> O que NÃO fazemos:</p>
                      <ul className="list-disc list-inside space-y-1 text-emerald-200/90 pl-1">
                        <li>Não geramos spam de API;</li>
                        <li>Nossos servidores não revendem dados;</li>
                        <li>Não exigimos CPF para reclamações anônimas.</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
              </div>
            )}

            {/* Sub-tab 2: Search Protocol Status timeline */}
            {cidadaoSubTab === "consultar" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    setCidadaoSubTab("inicio");
                    setSearchResult(null);
                    setSearchProtocolo("");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                  id="btn-voltar-inicio-consultar"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Início</span>
                </button>

                {/* Meus chamados vinculados à sua conta (Cidadão Logado) */}
                {currentUser && currentUser.perfil === UserPerfil.CITIZEN && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 gap-2">
                      <div>
                        <h4 className="text-sm font-black text-[#0b2545] uppercase flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-emerald-600" />
                          <span>Meus Protocolos Vinculados</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Sincronizados automaticamente com seu login ({currentUser.email})</p>
                      </div>

                      {/* Filter subset matching local input */}
                      <div className="relative text-xs w-full sm:w-60">
                        <input
                          type="text"
                          value={meusProtocolosFilter}
                          onChange={(e) => setMeusProtocolosFilter(e.target.value)}
                          placeholder="Filtrar por nº de protocolo..."
                          className="w-full pl-8 pr-3 py-1.5 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-emerald-600"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    {/* Protocols list */}
                    {(() => {
                      const citizenTickets = manifestacoes.filter(m => 
                        (!meusProtocolosFilter.trim() || m.protocolo.toLowerCase().includes(meusProtocolosFilter.toLowerCase()))
                      );

                      if (citizenTickets.length === 0) {
                        return (
                          <div className="text-center py-6 text-xs text-slate-400">
                            Nenhum protocolo verificado para os filtros aplicados.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                          {citizenTickets.map((t) => (
                            <div 
                              key={t.id}
                              onClick={() => {
                                setSearchResult(t);
                                setSearchProtocolo(t.protocolo);
                              }}
                              className={`p-3.5 rounded-xl border transition-all text-xs text-left cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm active:scale-[0.99] select-none hover:shadow-md ${
                                searchResult?.id === t.id 
                                  ? "bg-slate-50 border-emerald-600 ring-2 ring-emerald-500/25" 
                                  : "bg-white hover:bg-slate-50/50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-mono font-black text-[#0b2545]">{t.protocolo}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-center border ${
                                  t.status === "Respondido" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {t.status}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-650 font-medium line-clamp-1 italic">"{t.descricao}"</p>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-100 pt-1.5 mt-0.5">
                                <span className="text-emerald-700">{t.categoria}</span>
                                <span>{new Date(t.criadoEm).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-5">
                  <div className="text-center max-w-lg mx-auto space-y-1">
                    <h3 className="text-base font-bold text-slate-800">Acompanhamento e Rastreabilidade Parlamentar</h3>
                    <p className="text-xs text-slate-500">Insira seu número de protocolo (gerado na abertura de sua ficha ou via chatbot WhatsApp) para verificar andamentos e soluções oficiais de secretários</p>
                  </div>

                  <form onSubmit={handleSearchProtocolo} className="flex gap-2 text-xs">
                    <input
                      type="text"
                      value={searchProtocolo}
                      onChange={(e) => setSearchProtocolo(e.target.value)}
                      placeholder="Ex: OUV-20260520-X8J"
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-white font-bold text-lg focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-700 hover:bg-emerald-800 px-6 rounded-lg text-white font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Localizar</span>
                    </button>
                  </form>
                </div>

                {/* Displaying Timeline Result */}
                {searchResult ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6 animate-fade-in">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded font-bold uppercase">FICHA ATIVA</span>
                        <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mt-1">
                          <span>Protocolo: {searchResult.protocolo}</span>
                        </h4>
                      </div>

                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        searchResult.status === "Respondido" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {searchResult.status}
                      </span>
                    </div>

                    {/* Action Bar: Export & Email */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-[#0b2545] uppercase text-[10px] tracking-wider mr-2">Ações do Documento:</span>
                      
                      <button
                        onClick={() => handleDownloadExcel(searchResult)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-emerald-700 hover:border-emerald-200 hover:bg-slate-50 font-semibold shadow-sm transition transition-all duration-200 cursor-pointer"
                        title="Baixar planilha Excel do protocolo"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Planilha Excel / CSV</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPDFMock(searchResult)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-sky-700 hover:border-sky-200 hover:bg-slate-50 font-semibold shadow-sm transition transition-all duration-200 cursor-pointer"
                        title="Baixar versão PDF oficial para fardear / imprimir"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                        <span>Imprimir / PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          setTicketForEmail(searchResult);
                          setEmailDestinatarioLocal(currentUser?.email || searchResult.usuarioEmail || "");
                          setShowEmailModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition transition-all duration-200 cursor-pointer"
                        title="Enviar relatório completo para seu e-mail"
                      >
                        <Mail className="w-3.5 h-3.5 text-white" />
                        <span>Enviar por E-mail</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-slate-500 font-bold">Tipo:</p>
                        <p className="text-sm font-semibold">{searchResult.tipo} • Categoria: {searchResult.categoria}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold">Destinatário Legislativo:</p>
                        <p className="text-sm font-semibold">
                          {searchResult.vereadorId === "todos" ? "Todos os Vereadores" : searchResult.vereadorId === "ouvidoria" ? "Ouvidoria de Câmara" : "Vereador Silva"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold">Setor (Bairro Mapeado):</p>
                        <p className="text-sm font-semibold">{searchResult.bairro}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold">Prioridade recomendada:</p>
                        <p className="text-sm font-semibold text-rose-600 font-bold">{searchResult.prioridade}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500">Descrição do Munícipe:</p>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">{searchResult.descricao}</p>
                    </div>

                    {searchResult.fotoUrl && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500">Imagem vinculada pelo cidadão:</p>
                        <img src={searchResult.fotoUrl} alt="Anexo" className="max-h-60 rounded-xl object-contain border border-slate-200" />
                      </div>
                    )}

                    {/* Solutions contents */}
                    {searchResult.status === "Respondido" && searchResult.respostaMsg && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                        <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Resposta Oficial do Gabinete Legislativo</span>
                        <p className="text-xs text-emerald-900 leading-relaxed font-semibold">"{searchResult.respostaMsg}"</p>
                        <p className="text-[10px] text-emerald-600 font-bold">Respondido Oficialmente em: {new Date(searchResult.respondidoEm || "").toLocaleDateString()}</p>
                      </div>
                    )}

                    {/* Timeline Tracker Audit compliance */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Histórico de Trâmite de Auditoria (LGPD)</span>
                      </h5>

                      <div className="space-y-3.5 relative pl-4 border-l border-emerald-500/30 ml-2">
                        {searchResult.historicoLogs.map((log, lIdx) => (
                          <div key={lIdx} className="relative text-xs">
                            <span className="absolute -left-6.5 top-0.5 bg-emerald-500 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm"></span>
                            <p className="text-slate-650 leading-relaxed font-medium">{log}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  searchProtocolo && (
                    <div className="bg-slate-100 p-8 rounded-xl text-center border text-xs text-slate-500">
                      Nenhum resultado para exibir. Use o protocolo fictício <strong>OUV-20260520-X8J</strong> para testar a busca.
                    </div>
                  )
                )}

              </div>
            )}

            {/* Displaying feedback popup on creation */}
            {openTicketFeedback && (
              <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
                  <div className="text-center space-y-2">
                    <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Cidadão Ouvido com Sucesso!</h3>
                    <p className="text-xs text-slate-500">O protocolo de rastreamento legislativo foi emitido de acordo com as normas da LGPD:</p>
                    <div className="bg-slate-100 text-slate-800 font-mono text-xl font-bold py-2.5 rounded-lg tracking-widest border border-slate-200 select-all my-3">
                      {openTicketFeedback.protocolo}
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 space-y-1.5 text-xs text-emerald-800">
                    <p className="font-bold flex items-center gap-1.5 uppercase tracking-tight text-[10px] text-emerald-600">
                      <Sparkles className="w-3.5 h-3.5" /> Triagem IA imediata:
                    </p>
                    <p>• <strong>Categoria</strong>: {openTicketFeedback.categoria}</p>
                    <p>• <strong>Prioridade</strong>: {openTicketFeedback.prioridade}</p>
                    <p className="leading-relaxed border-t border-emerald-100 pt-2 text-[11px] text-emerald-700">
                      <strong>Resposta sugerida por IA</strong>: <br/>
                      <span className="italic">"{openTicketFeedback.respostaSugeridaIA}"</span>
                    </p>
                  </div>

                  <div className="flex pt-2">
                    <button
                      onClick={() => setOpenTicketFeedback(null)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 text-xs font-bold rounded-lg transition"
                    >
                      Fechar e Prosseguir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COBERTURA DE APOIO DE PUBLICIDADE INFERIOR DINÂMICA */}
            {publicidadeBottom && (
              <div className="bg-slate-50 border border-slate-200/75 p-5 rounded-2xl font-sans text-xs mt-8 text-left animate-fade-in animate-scale-up" id="propaganda-institucional-bottom">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-left md:max-w-2xl">
                    <span className="bg-slate-200 text-slate-700 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider inline-block">
                      {publicidadeBottom.category}
                    </span>
                    <h5 className="font-extrabold text-slate-800 mt-1">{publicidadeBottom.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{publicidadeBottom.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Acesso simulado: Redirecionando para o canal oficial de ${publicidadeBottom.category}.`);
                    }}
                    className="bg-slate-800 hover:bg-[#0b2545] text-white font-extrabold text-[10px] uppercase px-5.5 py-2.5 rounded-lg transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {publicidadeBottom.cta}
                  </button>
                </div>
              </div>
            )}

            {/* Citizen Footer with LGPD Compliance Note exactly matching the user reference screenshot */}
            <div className="flex flex-col items-center justify-center pt-8 pb-3 border-t border-slate-200 text-center gap-1 mt-8">
              <p className="text-xs text-slate-550 font-medium">
                OuviVereador IA © 2026 • Conforme LGPD Lei nº 13.709/2018 • MVP Fase 1
              </p>
              <p className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                Ouvidoria da Câmara Inteligente — Participação Popular e Transparência
              </p>
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* II. PRIVATE CABINET & VEREADORES MODE   */}
        {/* ======================================= */}
        {activeTab === "admin" && (
          <div className="space-y-6 animate-fade-in" id="cabinet-private-view">
            
            {/* Authentications Guard Check */}
            {(!currentUser || currentUser.perfil === UserPerfil.CITIZEN) ? (
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-md text-center space-y-4 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("cidadao")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer self-start"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Portal do Cidadão</span>
                </button>
                <div className="p-3 bg-rose-50 text-rose-500 rounded-full h-14 w-14 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800">Visualização de Cabine Administrativa Restrita</h3>
                  {currentUser?.perfil === UserPerfil.CITIZEN ? (
                    <p className="text-xs text-rose-650 font-bold leading-relaxed bg-rose-50 p-3 rounded-lg border border-rose-100">
                      Sua conta está cadastrada como perfil <strong>Cidadão</strong>. O painel de Zeladoria e Vereadores é restrito a parlamentares, equipe administrativa e o Administrador Geral. Faça login com credenciais autorizadas abaixo:
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Você deve se autenticar para acessar o painel. Insira as credenciais abaixo e clique no botão <strong>Entrar</strong> para prosseguir:
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 text-left p-4 rounded-xl text-xs space-y-2.5 border font-mono">
                  <p className="font-extrabold text-slate-700 text-center border-b pb-1.5 uppercase">CONTAS DE TESTE (MOCK):</p>
                  <div>
                    <span className="font-bold">1. Administrador Geral (Superadmin):</span>
                    <p className="pl-2">E-mail: <strong className="text-emerald-650 font-bold">admin@camara.gov.br</strong> / Senha: <strong className="text-emerald-650 font-bold">admin123</strong></p>
                  </div>
                  <div>
                    <span className="font-bold">2. Ouvidor Geral de Câmara:</span>
                    <p className="pl-2">E-mail: <strong className="text-emerald-650 font-bold">ouvidoria@camara.gov.br</strong> / Senha: <strong className="text-emerald-650 font-bold">ouvidoria123</strong></p>
                  </div>
                  <div>
                    <span className="font-bold">3. Vereador Específico (Silva):</span>
                    <p className="pl-2">E-mail: <strong className="text-emerald-650 font-bold">silva@camara.gov.br</strong> / Senha: <strong className="text-emerald-650 font-bold">silva123</strong></p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded mt-1">
                    <span className="font-bold text-emerald-800">4. Cidadão Geral (Qualquer pessoa):</span>
                    <p className="pl-2 text-emerald-900">E-mail: <strong className="font-bold">cidadao@gmail.com</strong> / Senha: <strong className="font-bold">cidadao123</strong></p>
                  </div>
                </div>

                {/* Direct inline login form container with the required 'Entrar' button */}
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-4 text-left border-t border-slate-100 w-full">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-600 uppercase text-[10px]/relaxed">E-mail de Login ou Telefone</label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-600 text-xs font-semibold bg-white text-slate-800 w-full"
                      placeholder="Ex: admin@camara.gov.br"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-600 uppercase text-[10px]/relaxed">Senha Secreta</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-600 text-xs font-extrabold bg-white text-slate-800 w-full"
                      placeholder="Sua senha de teste"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg text-xs text-white font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 uppercase tracking-wider"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Logar / Entrar no Painel</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              
              // Authenticated Dashboard Panel Layout
              <div className="space-y-6">
                
                {/* Visual Top stats parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-4.5 rounded-xl border border-slate-250 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Novas Queixas (Hoje)</span>
                      <p className="text-2xl font-black text-slate-800">{statsCounters.hoje}</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-xl border border-slate-250 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manifestações Pendentes</span>
                      <p className="text-2xl font-black text-amber-600">{statsCounters.pendentes}</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center bg-amber-50 text-amber-500 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-xl border border-slate-250 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solucionadas & Resp.</span>
                      <p className="text-2xl font-black text-emerald-600">{statsCounters.resolvidos}</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center bg-emerald-50 text-emerald-500 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-xl border border-slate-250 shadow-sm flex items-center justify-between col-span-1 border-l-4 border-l-rose-500">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Crítico SLA Alert</span>
                      <p className="text-2xl font-black text-rose-650 font-mono flex items-center gap-1">
                        <span>{statsCounters.urgentes}</span>
                        <span className="text-xs bg-rose-50 text-rose-700 px-1 py-0.5 rounded font-black animate-pulse">30d</span>
                      </p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center bg-rose-50 text-rose-600 rounded-lg">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-4.5 rounded-xl border border-slate-250 shadow-sm flex items-center justify-between col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-50 to-white">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Tempo Solução IA</span>
                      <p className="text-lg font-black text-emerald-900">{statsCounters.tempoMedio}</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center bg-emerald-100 text-emerald-800 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                {/* Left controls sidebar with sub-panels */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Menu buttons selection */}
                  {currentUser?.perfil === UserPerfil.ADMIN && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm self-start flex flex-col gap-1.5 w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase p-2 block">Painéis de Gestão</span>
                      
                      <button
                        onClick={() => setAdminReportType("dashboard")}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          adminReportType === "dashboard" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-emerald-400" />
                          <span>Manifestações Ativas</span>
                        </span>
                        <span className="bg-slate-205 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{manifestacoes.length}</span>
                      </button>

                      {(currentUser?.perfil === UserPerfil.ADMIN || currentUser?.perfil === UserPerfil.VEREADOR || currentUser?.perfil === UserPerfil.OUVIDORIA || currentUser?.perfil === UserPerfil.AUDITORIA) && (
                        <>
                          <button
                            onClick={() => setAdminReportType("secretarias")}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                              adminReportType === "secretarias" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Settings className="w-4 h-4 text-sky-400" />
                            <span>Gerenciar Vereadores (Gabinetes)</span>
                          </button>

                          <button
                            onClick={() => setAdminReportType("usuarios")}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              adminReportType === "usuarios" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4 text-amber-500" />
                              <span>Gerenciar Usuários</span>
                            </span>
                            <span className="text-[10px] bg-slate-350 text-slate-550 px-1.5 py-0.5 rounded-full" title="Restrito aos criados por ele">Limitado</span>
                          </button>

                          <button
                            onClick={() => setAdminReportType("auditoria")}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                              adminReportType === "auditoria" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Shield className="w-4 h-4 text-red-400" />
                            <span>Auditoria Logs (LGPD)</span>
                          </button>

                          <button
                            onClick={() => setAdminReportType("configuracoes")}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                              adminReportType === "configuracoes" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Palette className="w-4 h-4 text-emerald-400" />
                            <span>Configurações do App</span>
                          </button>
                        </>
                      )}

                      {/* Quick simulated downloads */}
                      <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2">Exportar Dados Técnicos</span>
                        
                        <button 
                          onClick={() => handleSimulateExport("pdf")}
                          className="w-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-705 p-2 rounded border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5 text-rose-600" />
                          <span>Baixar PDF Mensal</span>
                        </button>

                        <button 
                          onClick={() => handleSimulateExport("excel")}
                          className="w-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-705 p-2 rounded border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Baixar Excel Relatório</span>
                        </button>
                      </div>

                    </div>
                  )}

                  {/* Main administrative details display frame side */}
                  <div className={currentUser?.perfil === UserPerfil.ADMIN ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
                    
                    {/* SUB-PANEL A: Active lists and filters of complaints */}
                    {adminReportType === "dashboard" && (
                      <div className="space-y-6">
                        
                        {/* Filters list header */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Setor / Bairro</span>
                            <select 
                              value={adminFilterBairro}
                              onChange={(e) => setAdminFilterBairro(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-700"
                            >
                              <option value="todos">Todos</option>
                              <option value="Centro">Centro</option>
                              <option value="Alagoinhas Velha">Alagoinhas Velha</option>
                              <option value="Silva Jardim">Silva Jardim</option>
                              <option value="Catu">Catu</option>
                              <option value="Santa Terezinha">Santa Terezinha</option>
                              <option value="Kennedy">Kennedy</option>
                              <option value="Barreiro">Barreiro</option>
                              <option value="Petrolar">Petrolar</option>
                              <option value="Juca de Rosa">Juca de Rosa</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Situação (Status)</span>
                            <select 
                              value={adminFilterStatus}
                              onChange={(e) => setAdminFilterStatus(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-700"
                            >
                              <option value="todos">Todos</option>
                              <option value="Recebido">Recebidos</option>
                              <option value="Encaminhado para Vereador">Encaminhados</option>
                              <option value="Lido (Aguardando Resposta)">Lidos</option>
                              <option value="Respondido">Respondidos</option>
                              <option value="Solucionado">Solucionados</option>
                              <option value="Finalizado">Finalizados</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Urgência</span>
                            <select 
                              value={adminFilterPrioridade}
                              onChange={(e) => setAdminFilterPrioridade(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-700"
                            >
                              <option value="todos">Todas</option>
                              <option value="Baixa">Baixa</option>
                              <option value="Média">Média</option>
                              <option value="Alta">Alta</option>
                              <option value="Urgente">Urgente</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Vereador / Gabinete</span>
                            <select 
                              value={adminFilterSec}
                              onChange={(e) => setAdminFilterSec(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-700 font-mono text-[11px]"
                            >
                              <option value="todos">Todas</option>
                              {secretarias.map((s) => (
                                <option key={s.id} value={s.id}>{s.nome}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Data Início</span>
                            <input 
                              type="date"
                              value={adminFilterDateFrom}
                              onChange={(e) => setAdminFilterDateFrom(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded bg-white font-medium text-slate-750"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Data Fim</span>
                            <input 
                              type="date"
                              value={adminFilterDateTo}
                              onChange={(e) => setAdminFilterDateTo(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded bg-white font-medium text-slate-750"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-[#0b2545] uppercase font-sans tracking-tight">Assunto (Palavra-chave)</span>
                            <div className="relative">
                              <input 
                                type="text"
                                value={adminFilterAssunto}
                                onChange={(e) => setAdminFilterAssunto(e.target.value)}
                                placeholder="Filtrar por assunto ou descrição..."
                                className="w-full px-2 py-1.5 border border-slate-305 rounded-lg bg-white font-medium text-slate-750 focus:outline-none focus:border-slate-500 text-xs"
                              />
                              {adminFilterAssunto && (
                                <button 
                                  type="button"
                                  onClick={() => setAdminFilterAssunto("")}
                                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-[#0b2545] uppercase font-sans tracking-tight">Órgão / Destinatário</span>
                            <div className="relative">
                              <input 
                                type="text"
                                value={adminFilterOrgao}
                                onChange={(e) => setAdminFilterOrgao(e.target.value)}
                                placeholder="Ex: Infraestrutura, Saúde..."
                                className="w-full px-2 py-1.5 border border-slate-305 rounded-lg bg-white font-medium text-slate-750 focus:outline-none focus:border-slate-500 text-xs"
                              />
                              {adminFilterOrgao && (
                                <button 
                                  type="button"
                                  onClick={() => setAdminFilterOrgao("")}
                                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-[#0b2545] uppercase font-sans tracking-tight">E-mail do Cidadão</span>
                            <div className="relative">
                              <input 
                                type="text"
                                value={adminFilterEmail}
                                onChange={(e) => setAdminFilterEmail(e.target.value)}
                                placeholder="Filtrar por e-mail..."
                                className="w-full px-2 py-1.5 border border-slate-305 rounded-lg bg-white font-medium text-slate-750 focus:outline-none focus:border-slate-500 text-xs"
                              />
                              {adminFilterEmail && (
                                <button 
                                  type="button"
                                  onClick={() => setAdminFilterEmail("")}
                                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-500 uppercase font-sans">Alerta de SLA</span>
                            <select 
                              value={adminFilterAlerta}
                              onChange={(e) => setAdminFilterAlerta(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-700"
                            >
                              <option value="todos">Qualquer Alerta</option>
                              <option value="critico">🚨 Crítico (25+ dias)</option>
                              <option value="alerta">⚠️ Alerta (15-24 dias)</option>
                              <option value="emdia">✓ Em dia (&lt;15 dias)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-5">
                            <input 
                              type="checkbox"
                              id="filter-marcadas-only"
                              checked={adminFilterMarcadasOnly}
                              onChange={(e) => setAdminFilterMarcadasOnly(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <label htmlFor="filter-marcadas-only" className="font-bold text-[#0b2545] uppercase font-sans text-[10px] tracking-tight cursor-pointer select-none">
                              Apenas as Marcadas ({selectedTicketIds.length})
                            </label>
                          </div>

                        </div>

                        {/* List grid list */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pb-4">
                          <div className="bg-slate-50 px-5 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                              <ClipboardList className="w-4.5 h-4.5 text-emerald-600" />
                              <span>Planilha de Chamados Ativos ({filteredAdminTickets.length})</span>
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSimulateExport("pdf")}
                                className="bg-white hover:bg-slate-50 text-rose-650 border border-slate-250 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                                title="Exportar dados filtrados para PDF"
                              >
                                <FileDown className="w-3.5 h-3.5 text-rose-600" />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSimulateExport("excel")}
                                className="bg-white hover:bg-slate-50 text-emerald-750 border border-slate-250 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                                title="Exportar planilha para Excel"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Excel</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReportEmailDestination(currentUser?.email || "");
                                  setShowGlobalReportModal(true);
                                }}
                                className="bg-slate-900 hover:bg-slate-950 text-white px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow transition"
                              >
                                <Send className="w-3.5 h-3.5 text-sky-450" />
                                <span>Transmitir Relatório</span>
                              </button>
                            </div>
                          </div>

                          {/* Bulk Actions Panel */}
                          {selectedTicketIds.length > 0 && (
                            <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-md my-4 animate-scale-up text-white">
                              {/* Quick Actions Header */}
                              <div className="bg-slate-950 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px]">
                                    {selectedTicketIds.length} selecionado(s)
                                  </span>
                                  <p className="font-bold">Ações em Lote e Despachos Rápidos:</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                  <select
                                    value={batchAcao}
                                    onChange={(e) => setBatchAcao(e.target.value as any)}
                                    className="bg-slate-850 text-white font-bold px-3 py-1.5 rounded border border-slate-700 focus:outline-none text-xs"
                                  >
                                    <option value="encaminhar">📦 Encaminhar (Enviar p/ Destinatário)</option>
                                    <option value="enviar-responsavel">👤 Enviar para Setor ou Pessoa Responsável</option>
                                    <option value="concluir">✓ Marcar como Concluído</option>
                                    <option value="andamento">⏳ Marcar em Andamento</option>
                                    <option value="excluir">❌ Excluir Definitivamente</option>
                                  </select>

                                  {(batchAcao === "encaminhar" || batchAcao === "enviar-responsavel") && (
                                    <input 
                                      type="text"
                                      value={batchDestino}
                                      onChange={(e) => setBatchDestino(e.target.value)}
                                      placeholder={batchAcao === "enviar-responsavel" ? "Nome da pessoa..." : "Nome do legislador competente..."}
                                      className="bg-white text-slate-900 border font-bold px-3 py-1.5 rounded focus:outline-none text-xs min-w-[180px]"
                                    />
                                  )}

                                  <button
                                    type="button"
                                    onClick={handleBatchAction}
                                    disabled={isExecutingBatch}
                                    className={`px-4 py-1.5 rounded font-black text-xs cursor-pointer flex items-center gap-1.5 transition ${
                                      batchAcao === "excluir" 
                                        ? "bg-rose-600 hover:bg-rose-700 text-white" 
                                        : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                                    } disabled:opacity-50`}
                                  >
                                    {isExecutingBatch ? (
                                      <>
                                        <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span>Processando...</span>
                                      </>
                                    ) : (
                                      <span>Aplicar Ação</span>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Dedicated Gabinete Inteligente de Despachos */}
                              <div className="bg-slate-50 p-4 border-t border-slate-200 text-slate-800 space-y-4">
                                <div className="border-b pb-2">
                                  <h4 className="text-xs font-black text-slate-900 flex flex-wrap items-center gap-1.5 uppercase">
                                    <span className="bg-amber-600 text-white px-2 py-0.5 rounded font-mono text-[9px] font-black leading-snug">Gabinete Oficial</span>
                                    <span>Gabinete Eletrônico de Despacho Integrado (IA & Prova Documental)</span>
                                  </h4>
                                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">
                                    Oficialize o regimento encaminhando mensagens para outros agentes públicos, vereadores ou procuradores técnicos. Uma cópia jurídica comprobatória de prova será despachada automaticamente para o seu e-mail alternativo registrado sob as normas de auditoria.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-medium">
                                  {/* Select responsible agent */}
                                  <div className="md:col-span-5 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-700 block uppercase">1. Selecionar Pessoa Responsável (Destinatário)</label>
                                    <select
                                      value={dispatchResponsavelId}
                                      onChange={(e) => setDispatchResponsavelId(e.target.value)}
                                      className="w-full px-2.5 py-2.5 border border-slate-300 bg-white rounded font-semibold text-slate-800 focus:ring-1 focus:ring-amber-500"
                                    >
                                      <option value="">Selecione quem receberá esta atribuição...</option>
                                      {usuarios
                                        .filter(u => u.perfil !== UserPerfil.CITIZEN)
                                        .map((u) => (
                                          <option key={u.id} value={u.id}>
                                            {u.nome} ({u.perfil}) {u.emailAlternativo ? `📨 [Cópia Ativa: ${u.emailAlternativo}]` : "⚠️ [Sem e-mail secundário]"}
                                          </option>
                                        ))
                                      }
                                    </select>
                                    <div className="bg-slate-100 p-2 rounded text-[10px] text-slate-500 leading-normal border">
                                      *De acordo com a solicitação municipal, os vereadores e agentes institucionais podem despachar e enviar relatos diretamente para o <strong>Procurador da Câmara</strong>.
                                    </div>
                                  </div>

                                  {/* Dispatch block with AI assistance */}
                                  <div className="md:col-span-7 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-700 uppercase">2. Escreva o Despacho (Recado legislativo)</label>
                                      <button
                                        type="button"
                                        onClick={handleImproveDispatchWithIA}
                                        disabled={isImprovingDispatch || !dispatchDespachoText.trim()}
                                        className="inline-flex items-center gap-1.5 text-[9.5px] bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-black px-2.5 py-1 rounded-md transition cursor-pointer shadow-sm animate-pulse-subtle"
                                      >
                                        {isImprovingDispatch ? (
                                          <>
                                            <span className="h-2 w-2 border border-white/40 border-t-white rounded-full animate-spin inline-block"></span>
                                            <span>IA Refinando...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>✨ Melhorar e Formalizar por IA</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    <textarea
                                      rows={3}
                                      value={dispatchDespachoText}
                                      onChange={(e) => setDispatchDespachoText(e.target.value)}
                                      placeholder="Rascunhe aqui as diretrizes básicas do despacho. Ex: 'Favor encaminhar para estudo de viabilidade técnica no bairro...'"
                                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-amber-500 font-medium leading-relaxed"
                                    />

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                                      <span className="text-[9.5px] text-slate-500 font-medium block">
                                        *Cópia com fé de ofício será anexada sob o CNPJ desta casa de leis.
                                      </span>
                                      <button
                                        type="button"
                                        onClick={handleSubmitDespachoOficial}
                                        disabled={isSubmittingDispatch || !dispatchResponsavelId || !dispatchDespachoText.trim()}
                                        className="bg-amber-655 hover:bg-amber-700 bg-slate-900 text-white font-black px-4.5 py-2.5 rounded-lg text-[10.5px] transition shadow-md disabled:opacity-45 cursor-pointer inline-flex items-center gap-2 uppercase tracking-wider self-end sm:self-auto"
                                      >
                                        {isSubmittingDispatch ? "Transmitindo..." : "📨 Despachar com Registro de Prova"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-650 font-bold">
                                  {currentUser?.perfil && currentUser?.perfil !== UserPerfil.CITIZEN && (
                                    <th className="px-4 py-3 w-10 text-center">
                                      <input 
                                        type="checkbox"
                                        checked={filteredAdminTickets.length > 0 && selectedTicketIds.length === filteredAdminTickets.length}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedTicketIds(filteredAdminTickets.map(t => t.id));
                                          } else {
                                            setSelectedTicketIds([]);
                                          }
                                        }}
                                        className="h-4 w-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                      />
                                    </th>
                                  )}
                                  <th className="px-4 py-3">Protocolo</th>
                                  <th className="px-4 py-3">Tipo / Categoria</th>
                                  <th className="px-4 py-3">Bairro / Setor</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3 font-right text-right">SLA Alert</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredAdminTickets.map((t) => {
                                  // compute color warning based on SLA
                                  const slaAlert = getTicketSLAlert(t);

                                  return (
                                    <tr 
                                      key={t.id} 
                                      className={`border-b border-slate-100 hover:bg-slate-50 transition-all font-medium ${
                                        selectedTicketIds.includes(t.id) ? "bg-slate-50 border-l-4 border-l-slate-600 font-bold" : (t.destacada ? "bg-rose-50/80 border-l-4 border-l-rose-500 font-extrabold animate-pulse-subtle" : (slaAlert.rowClass || ""))
                                      }`}
                                    >
                                      {currentUser?.perfil && currentUser?.perfil !== UserPerfil.CITIZEN && (
                                        <td className="px-4 py-3 w-10 text-center">
                                          <input 
                                            type="checkbox"
                                            checked={selectedTicketIds.includes(t.id)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedTicketIds(prev => [...prev, t.id]);
                                              } else {
                                                setSelectedTicketIds(prev => prev.filter(uid => uid !== t.id));
                                              }
                                            }}
                                            className="h-4 w-4 rounded border-slate-350 text-slate-800 focus:ring-slate-800 cursor-pointer"
                                          />
                                        </td>
                                      )}
                                      <td className="px-4 py-3">
                                        <span className="font-bold font-mono text-[11px] block">{t.protocolo}</span>
                                        <span className="text-[10px] text-slate-400 font-medium block">Aberto: {new Date(t.criadoEm).toLocaleDateString()}</span>
                                        {t.destacada && (
                                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-905 border border-rose-300 rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wide mt-1 animate-pulse shrink-0">
                                            🚨 Institucional: {t.origem}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="font-bold block text-slate-800">{t.tipo}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">{t.categoria}</span>
                                      </td>
                                      <td className="px-4 py-3">{t.bairro}</td>
                                      <td className="px-4 py-3 text-[10px]">
                                        <span className={`px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-tight ${
                                          t.status === "Respondido" 
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800 border"
                                        }`}>
                                          {t.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-[10px]">
                                        {t.status === "Lido (Aguardando Resposta)" ? (
                                          <span className={`px-2 py-1 rounded-md text-[9px] font-bold border block text-center ${slaAlert.colorClass}`}>
                                            {slaAlert.label}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-mono italic">SLA inativo</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {filteredAdminTickets.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                                      Nenhum chamado ativo localizado para esta combinação de filtros de mesa de controle.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Interactive HEATMAP display sector */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <ReportHeatmap manifestacoes={manifestacoes} secretarias={secretarias} />
                        </div>

                      </div>
                    )}

                    {/* Treat Selected Ticket Details panel (IA suggestion) */}
                    {adminReportType === "dashboard" && selectedTicket && (
                      <div className="bg-white rounded-xl border-2 border-emerald-600/35 overflow-hidden shadow-lg p-6 space-y-6 animate-scale-up" id="ticket-action-cabinet">
                        
                        <div className="flex items-center justify-between border-b pb-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gabinete de Atendimento</span>
                            <h4 className="text-sm font-black text-slate-800">Processamento de: {selectedTicket.protocolo}</h4>
                          </div>
                          <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-800">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 p-3 rounded-lg border">
                            <p className="font-bold text-slate-500 uppercase">Cidadão Manifestante (LGPD Encriptado)</p>
                            <p className="font-black text-slate-800 text-sm mt-1">{selectedTicket.usuarioNome || "Anônimo"}</p>
                            <p className="mt-0.5">E-mail: <strong className="font-mono">{selectedTicket.usuarioEmail || "Ocultado (Termos LGPD)"}</strong></p>
                            <p>Telefone: <strong>{selectedTicket.usuarioTelefone || "---"}</strong></p>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border">
                            <p className="font-bold text-slate-500 uppercase">Mapeamento de Triagem Atual de IA</p>
                            <p className="mt-1">Categoria: <strong className="text-emerald-700">{selectedTicket.categoria}</strong></p>
                            <p>Vereador responsável: <strong>{secretarias.find(s=>s.id===selectedTicket.secretariaId)?.nome || "Não associado"}</strong></p>
                            <p>Status atual: <strong className="text-amber-700">{selectedTicket.status}</strong></p>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="font-bold text-slate-650">Descrição Original:</p>
                          <p className="bg-slate-50 p-4 rounded-xl border leading-relaxed text-slate-800 italic">"{selectedTicket.descricao}"</p>
                        </div>

                        {/* Interactive triggers actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-5">
                          
                          {/* Col 1: Read trigger (Activates SLA sequence) */}
                          <div className="space-y-3 bg-slate-100/50 p-3.5 rounded-lg border">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase border-b pb-1 font-mono">1. Notificar Leitura (SLA)</span>
                            <p className="text-[10px] text-slate-500 leading-relaxed">Informa formalmente ao cidadão que o encargo técnico foi acolhido e lido pelo responsável. Dispara a contagem máxima de 30 dias úteis.</p>
                            
                            {selectedTicket.lidoEm ? (
                              <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded text-center border border-emerald-100 flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Lido em: {new Date(selectedTicket.lidoEm).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleMarkAsRead(selectedTicket.id)}
                                className="w-full text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 py-2 rounded-lg cursor-pointer"
                              >
                                Marcar como Lido
                              </button>
                            )}
                          </div>

                          {/* Col 2: Forwarding compartment */}
                          <div className="space-y-3 bg-slate-100/50 p-3.5 rounded-lg border">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase border-b pb-1">2. Re-encaminhar Vereador</span>
                            <p className="text-[10px] text-slate-500 leading-relaxed">Tem outro entendimento de qual Vereador deve intervir? Re-encaminhe ao gabinete competente instantaneamente:</p>
                            
                            <div className="flex gap-1.5">
                              <select
                                value={forwardSecId}
                                onChange={(e) => setForwardSecId(e.target.value)}
                                className="px-1.5 py-1.5 border border-slate-300 rounded bg-white text-[10px] font-medium grow"
                              >
                                <option value="">Selecionar...</option>
                                {secretarias.map(s => (
                                  <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                              </select>
                              <button
                                onClick={handleForwardToSecretaria}
                                className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-black px-2.5 rounded cursor-pointer"
                              >
                                Enviar
                              </button>
                            </div>
                          </div>

                          {/* Col 3: Reclassify sub categorizations */}
                          <div className="space-y-3 bg-slate-100/50 p-3.5 rounded-lg border col-span-1">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase border-b pb-1">3. Reclassificar Tópico</span>
                            
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={reclassCategory}
                                onChange={(e) => setReclassCategory(e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-[10px]"
                                placeholder="Categoria..."
                              />
                              <div className="flex gap-1">
                                <select
                                  value={reclassPriority}
                                  onChange={(e) => setReclassPriority(e.target.value as ManifestacaoPrioridade)}
                                  className="px-1.5 py-1 border border-slate-300 rounded bg-white text-[10px] grow"
                                >
                                  <option value="Baixa">Baixa</option>
                                  <option value="Média">Média</option>
                                  <option value="Alta">Alta</option>
                                  <option value="Urgente">Urgente</option>
                                </select>
                                <button
                                  onClick={handleReclassifyTicket}
                                  className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] px-2.5 rounded font-bold cursor-pointer"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* --- AI-POWERED RESPONSE SUGGESTION SYSTEM --- */}
                        {/* Ao classificar um chamado, a IA deve analisar o texto da descrição e propor um rascunho. */}
                        <div className="bg-emerald-50 border border-emerald-250 p-5 rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-emerald-200/55 pb-2.5">
                            <span className="text-xs font-black text-emerald-850 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                              Rascunho de Resposta Inteligente Sugerida por IA
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setWorkspaceAnswerMsg(selectedTicket.respostaSugeridaIA || "");
                                triggerToast("Rascunho copiado para o editor de resposta!");
                              }}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-bold transition cursor-pointer"
                            >
                              Copiar para Editor
                            </button>
                          </div>

                          <p className="text-xs text-emerald-800 italic leading-relaxed">
                            "{selectedTicket.respostaSugeridaIA || "Aguardando rascunho de IA..."}"
                          </p>
                          <p className="text-[9px] text-emerald-650 font-bold">
                            *Este rascunho foi gerado de forma barata utilizando o modelo de linguagem natural gemini-3.5-flash com fallback offline.
                          </p>
                        </div>

                        {/* Form de Tratamento Completo do Gabinete / Ouvidor / Vereadores */}
                        <div className="border-t pt-5 space-y-4">
                          <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Tratamento Técnico & Ficha de Solução Institucional</span>
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-650 mb-1">
                                A quem delegou resolver (Responsável, Vereador, Órgão ou Entidade):
                              </label>
                              <input 
                                type="text"
                                value={forwardDestination}
                                onChange={(e) => setForwardDestination(e.target.value)}
                                placeholder="Digite a quem delegou (Ex: Assessoria de Obras, Vereador Silva, Secretaria de Planejamento...)"
                                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-650 mb-1">
                                Observação / Despacho de Tratamento:
                              </label>
                              <textarea
                                value={resolutionObs}
                                onChange={(e) => setResolutionObs(e.target.value)}
                                rows={2}
                                placeholder="Descreva as observações de concluído, pendente ou aguardando conclusão..."
                                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-650">
                              Resposta Oficial Definitiva para o Cidadão (Aparecerá na consulta do Protocolo):
                            </label>
                            <textarea
                              value={workspaceAnswerMsg}
                              onChange={(e) => setWorkspaceAnswerMsg(e.target.value)}
                              rows={3}
                              placeholder="Prezada Ouvidoria e Munícipe, informamos que foram tomadas as devidas providências com o intuito de resolver..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {/* Dynamic preview of current logged resolution fields if saved before */}
                          {(selectedTicket.observacaoResolvido || selectedTicket.encaminhadoPara) && (
                            <div className="bg-slate-50 border p-3 rounded-lg text-[10px] text-slate-600 space-y-1">
                              <p className="font-extrabold text-slate-500 uppercase tracking-wider">Histórico de Tratamento Prévio Cadastrado:</p>
                              {selectedTicket.encaminhadoPara && <p>• <strong>A quem delegou resolver:</strong> {selectedTicket.encaminhadoPara}</p>}
                              {selectedTicket.observacaoResolvido && <p>• <strong>Observação arquivada:</strong> {selectedTicket.observacaoResolvido}</p>}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row justify-end gap-2 text-xs pt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(null)}
                              className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-bold cursor-pointer animate-scale-up"
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCompleteResolution("Em Análise", resolutionObs, forwardDestination, workspaceAnswerMsg)}
                              className="bg-amber-650 hover:bg-amber-700 text-white px-4 py-2 rounded text-xs font-semibold cursor-pointer animate-scale-up"
                            >
                              Salvar como Pendente
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCompleteResolution("Lido (Aguardando Resposta)", resolutionObs, forwardDestination, workspaceAnswerMsg)}
                              className="bg-sky-650 hover:bg-sky-700 text-white px-4 py-2 rounded text-xs font-semibold cursor-pointer animate-scale-up"
                            >
                              Aguardando Conclusão
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCompleteResolution("Solucionado", resolutionObs, forwardDestination, workspaceAnswerMsg)}
                              className="bg-emerald-650 hover:bg-emerald-700 text-white px-5 py-2 rounded text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 shadow-sm animate-scale-up"
                            >
                              <Check className="w-4 h-4 text-emerald-100" />
                              <span>Definir como Concluído</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* SUB-PANEL B: secretarias Manager (Admin General or authorized personnel) */}
                    {adminReportType === "secretarias" && currentUser?.perfil === UserPerfil.ADMIN && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h4 className="text-sm font-black text-slate-800">Organograma de Vereadores (Gabinetes)</h4>
                            <p className="text-[11px] text-slate-500">Mapeamento de Gabinetes de Vereadores encarregados de acolher e resolver as demandas cidadãs</p>
                          </div>
                          <button
                            onClick={() => setShowSecAddModal(true)}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Adicionar Vereador / Gabinete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {secretarias.map((s) => (
                            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h5 className="font-bold text-slate-800 text-sm">{s.nome}</h5>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">ID: {s.id}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingSecId(s.id);
                                      setAddSecNome(s.nome);
                                      setAddSecEmail(s.email);
                                      setAddSecResp(s.responsavelNome);
                                      setShowSecAddModal(true);
                                    }}
                                    className="p-1 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                                    title="Editar Vereador / Gabinete"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSecretaria(s.id)}
                                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                    title="Remover Vereador / Gabinete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="text-xs space-y-1 text-slate-600 border-t pt-3">
                                <p>📧 E-mail: <strong>{s.email}</strong></p>
                                <p>👤 Vereador Responsável: <strong>{s.responsavelNome}</strong></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-PANEL C: Users Accounts and passwords checks (Only created by currently logged-in Admin!) */}
                    {adminReportType === "usuarios" && currentUser?.perfil === UserPerfil.ADMIN && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h4 className="text-sm font-black text-slate-800">Mesa de Usuários Administrativos</h4>
                            <p className="text-[11px] text-slate-500">
                              Gerencie as permissões e gabinetes. {currentUser.perfil === "Administrador Geral" && currentUser.id !== "u-admin" ? "Mostrando apenas usuários criados por você." : "Acesso total de Superadmin."}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowUserAddModal(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Criar Novo Usuário Administrador</span>
                          </button>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-bold">
                                <th className="px-4 py-3">Credencial / Conta</th>
                                <th className="px-4 py-3">Telefone</th>
                                <th className="px-4 py-3">Perfil Executivo</th>
                                <th className="px-4 py-3">Provisório?</th>
                                <th className="px-4 py-3 text-right">Controles</th>
                              </tr>
                            </thead>
                            <tbody>
                              {usuarios.map((u) => {
                                return (
                                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                      <span className="font-bold block text-slate-800">{u.nome}</span>
                                      <span className="text-[10px] text-slate-500 font-medium block font-mono">{u.email}</span>
                                    </td>
                                    <td className="px-4 py-3">{u.telefone}</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-700">
                                      <div>{u.perfil}</div>
                                      {u.cargo && (
                                        <div className="text-[10px] text-slate-500 font-bold tracking-tight">Cargo: <span className="text-slate-800 font-extrabold">{u.cargo}</span></div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-rose-600">
                                      {u.loginProvisorio ? "Sim (Mudar 1º acesso)" : "Não"}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                      <button
                                        onClick={() => {
                                          setEditingUserId(u.id);
                                          setAddUserNome(u.nome || "");
                                          setAddUserEmail(u.email || "");
                                          setAddUserTelefone(u.telefone || "");
                                          setAddUserPerfil(u.perfil);
                                          setAddUserCargoNome(u.cargo || "");
                                          setAddUserSenha(""); // Deixar em branco para não alterar
                                          setAddUserEmailAlternativo(u.emailAlternativo || "");
                                          setShowUserAddModal(true);
                                        }}
                                        className="text-[11px] text-slate-400 hover:text-sky-600 font-bold uppercase transition inline-flex items-center gap-1 cursor-pointer mr-2"
                                        title="Editar credencial"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Editar</span>
                                      </button>

                                      <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-[11px] text-slate-400 hover:text-rose-600 font-bold uppercase transition inline-flex items-center gap-1 cursor-pointer"
                                        title="Remover credencial"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Excluir</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SUB-PANEL D: Audits transparency check logs (Compliance LGPD) */}
                    {adminReportType === "auditoria" && currentUser?.perfil === UserPerfil.ADMIN && (
                      <div className="space-y-6">
                        <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-black text-slate-800">Trilha de Logs e Auditoria Permanente (LGPD)</h4>
                            <p className="text-[11px] text-slate-500">Toda visualização, alteração, leitura e exclusão automatizada é auditável e registrada de forma inviolável no sistema</p>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 font-sans shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Buscar por Nome, Cargo ou E-mail</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={auditSearchQuery}
                                onChange={(e) => setAuditSearchQuery(e.target.value)}
                                placeholder="Filtrar por nome, cargo ou e-mail..."
                                className="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 font-bold"
                              />
                              {auditSearchQuery && (
                                <button 
                                  type="button" 
                                  onClick={() => setAuditSearchQuery("")}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-wider"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 text-slate-300 p-5 rounded-xl border border-slate-950 font-mono text-[11.5px] leading-relaxed max-h-[480px] overflow-y-auto space-y-4 shadow-inner animate-fade-in" id="audit-logs-terminal">
                          {(() => {
                            const filtered = auditLogs.filter((log) => {
                              const q = auditSearchQuery.toLowerCase().trim();
                              if (!q) return true;
                              const nameMatch = (log.usuarioNome || "").toLowerCase().includes(q);
                              const emailMatch = (log.usuarioEmail || "").toLowerCase().includes(q);
                              const cargoMatch = (log.cargo || "").toLowerCase().includes(q);
                              const actionMatch = (log.acao || "").toLowerCase().includes(q);
                              return nameMatch || emailMatch || cargoMatch || actionMatch;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="text-slate-500 text-center py-8 italic font-sans text-xs">
                                  Nenhum log correspondente aos filtros de busca ("{auditSearchQuery}").
                                </div>
                              );
                            }

                            return filtered.map((log) => (
                              <div key={log.id} className="border-b border-slate-800 pb-3 gap-2 flex flex-col sm:flex-row sm:items-start text-xs">
                                <span className="text-emerald-400 shrink-0 select-none">[{new Date(log.timestamp).toLocaleString()}]</span>
                                <div className="text-slate-200">
                                  <span>
                                    Usuário: <strong className="text-white">{log.usuarioNome}</strong> (<span className="text-sky-300">{log.usuarioEmail}</span>)
                                    {log.cargo && (
                                      <span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-sans ml-2 border border-slate-700 font-medium">
                                        Cargo: {log.cargo}
                                      </span>
                                    )}
                                  </span>
                                  <p className="text-slate-400 mt-1">Ação executada: <span className="text-amber-300 font-bold">{log.acao}</span></p>
                                  {log.protocoloRef && <p className="text-[10px] text-slate-500">Referência Protocolo: {log.protocoloRef}</p>}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* SUB-PANEL E: App Visual Configuration (Admin Only) */}
                    {adminReportType === "configuracoes" && currentUser?.perfil === UserPerfil.ADMIN && (
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-scale-up" id="admin-configurator-panel">
                        <div className="border-b pb-3">
                          <h4 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                            <Palette className="w-5 h-5 text-emerald-600" />
                            <span>Personalização do App e Identidade Visual</span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">Altere as cores principais, logomarca oficial e os textos de cabeçalho da sua Ouvidoria Legislativa Inteligente.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs" id="app-config-inputs-form">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Nome da Câmara / App</label>
                              <input 
                                type="text" 
                                value={headerConfig.municipioNome}
                                onChange={(e) => setHeaderConfig({ ...headerConfig, municipioNome: e.target.value })}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 font-medium text-slate-800 bg-white"
                                placeholder="Ex: Câmara Municipal de Rio Claro"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Nome do Programa de Ouvidoria</label>
                              <input 
                                type="text" 
                                value={headerConfig.nomePrograma}
                                onChange={(e) => setHeaderConfig({ ...headerConfig, nomePrograma: e.target.value })}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 font-medium text-slate-800 bg-white"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider flex items-center gap-1">
                                <span>URL da Logomarca (Brasão / Foto)</span>
                              </label>
                              <input 
                                type="text" 
                                value={headerConfig.logoUrl}
                                onChange={(e) => setHeaderConfig({ ...headerConfig, logoUrl: e.target.value })}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 font-mono text-[11px] bg-white"
                                placeholder="https://..."
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">
                                Frase de Boas-vindas Principal
                              </label>
                              <textarea 
                                value={headerConfig.welcomeGreeting || ""}
                                onChange={(e) => setHeaderConfig({ ...headerConfig, welcomeGreeting: e.target.value })}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 font-medium text-slate-800 bg-white"
                                placeholder="Entre com a frase de boas vindas"
                                rows={2}
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">
                                Frase do Subtítulo (Branding Superior)
                              </label>
                              <input 
                                type="text"
                                value={headerConfig.appSubTitle || ""}
                                onChange={(e) => setHeaderConfig({ ...headerConfig, appSubTitle: e.target.value })}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 font-medium text-slate-800 bg-white text-xs"
                                placeholder="Atendimento ao Cidadão • Legislativo Municipal"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider block">Selecione uma Cor de Fundo do Cabeçalho</label>
                              <div className="grid grid-cols-2 gap-2" id="color-preset-selectors font-sans">
                                {[
                                  { name: "Verde Bandeira (Gov)", value: "#024a30" },
                                  { name: "Azul Marinho Oficial", value: "#1e3a8a" },
                                  { name: "Slate Executivo", value: "#0f172a" },
                                  { name: "Vinho Ouvidoria", value: "#581c87" },
                                  { name: "Verde Esmeralda", value: "#065f46" },
                                  { name: "Preto Absoluto", value: "#000000" }
                                ].map((c) => (
                                  <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setHeaderConfig({ ...headerConfig, backgroundColor: c.value })}
                                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                                      headerConfig.backgroundColor === c.value ? "ring-2 ring-emerald-500 bg-slate-50 border-emerald-400" : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <span className="w-4 h-4 rounded-full inline-block border border-black/10 shrink-0 shadow-sm" style={{ backgroundColor: c.value }} />
                                    <span className="truncate">{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 font-sans">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider block">Cor Personalizada (Seletor Manual)</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="color" 
                                  value={headerConfig.backgroundColor}
                                  onChange={(e) => setHeaderConfig({ ...headerConfig, backgroundColor: e.target.value })}
                                  className="h-9 w-12 border border-slate-300 rounded-md cursor-pointer shrink-0 bg-white p-1"
                                />
                                <input 
                                  type="text" 
                                  value={headerConfig.backgroundColor}
                                  onChange={(e) => setHeaderConfig({ ...headerConfig, backgroundColor: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                                  placeholder="#ffffff"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 flex justify-end gap-3" id="app-config-actions-block">
                          <button 
                            type="button" 
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/header-config");
                                if (res.ok) {
                                  const data = await res.json();
                                  setHeaderConfig(data);
                                  triggerToast("Configurações revertidas para as originais!");
                                }
                              } catch {
                                triggerToast("Erro ao reverter.", false);
                              }
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                          >
                            Reverter Alterações
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/header-config", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(headerConfig)
                                });
                                if (res.ok) {
                                  triggerToast("Salvo! Identidade visual e logo atualizados com sucesso!");
                                } else {
                                  triggerToast("Erro ao salvar.", false);
                                }
                              } catch {
                                triggerToast("Erro ao salvar.", false);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2 rounded-lg text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aplicar e Salvar Visual</span>
                          </button>
                        </div>

                        {/* GERENCIAMENTO DE PUBLICIDADES E INFORMATIVOS OPERADOS PELO ADMIN */}
                        <div className="border-t pt-6 space-y-4 font-sans text-xs" id="admin-ads-manager">
                          <div className="border-b pb-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                              <Megaphone className="w-4.5 h-4.5 text-amber-600 font-sans" strokeWidth={2.5} />
                              <span>Painel de Informativos e Publicidade (Exclusivo Admin)</span>
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              Gerencie as campanhas e informativos visíveis para os cidadãos no portal principal. Apenas administradores do sistema podem postar ou alterar conteúdos sob as normativas municipais.
                            </p>
                          </div>

                          {/* Top Ad list and actions */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                                <span>1. Informativos do Carrossel Superior ({publicidadesTop.length})</span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTopAd({
                                    category: "Informativo Público",
                                    title: "",
                                    highlight: "",
                                    details: "",
                                    cta: "Saber Mais"
                                  });
                                  setShowTopAdModal(true);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition shadow flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>+ Novo Informativo</span>
                              </button>
                            </div>

                            {publicidadesTop.length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic py-2">Nenhum informativo superior cadastrado no momento.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {publicidadesTop.map((ad: any) => (
                                  <div key={ad.id} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between shadow-sm hover:border-amber-300 transition gap-2">
                                    <div>
                                      <span className="bg-amber-100 text-amber-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                                        {ad.category}
                                      </span>
                                      <h6 className="font-bold text-slate-800 mt-1 leading-snug">{ad.title}</h6>
                                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{ad.highlight}</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-2 mt-1">
                                      <span className="text-[9px] font-bold text-slate-400">CTA: "{ad.cta}"</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingTopAd(ad);
                                            setShowTopAdModal(true);
                                          }}
                                          className="text-slate-600 hover:text-amber-800 font-extrabold text-[10px] cursor-pointer"
                                        >
                                          Editar
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm(`Remover definitivo: "${ad.title}" ?`)) {
                                              try {
                                                const res = await fetch(`/api/publicidades/top/${ad.id}?adminEmail=${encodeURIComponent(currentUser?.email || "admin@camara.gov.br")}`, {
                                                  method: "DELETE"
                                                });
                                                if (res.ok) {
                                                  const rJson = await res.json();
                                                  setPublicidadesTop(rJson.publicidadesTop || []);
                                                  triggerToast("Informativo superior removido com sucesso!");
                                                } else {
                                                  triggerToast("Erro ao excluir.", false);
                                                }
                                              } catch {
                                                triggerToast("Falha de rede ao excluir.", false);
                                              }
                                            }
                                          }}
                                          className="text-rose-600 hover:text-rose-800 font-extrabold text-[10px] cursor-pointer"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Dynamic Bottom Ad single config panel */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <h5 className="font-extrabold text-slate-800 text-xs">
                              2. Propaganda Institucional de Rodapé (Estática)
                            </h5>

                            {publicidadeBottom ? (
                              <div className="space-y-3 font-sans" id="bottom-ad-editor-fields">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Editoria / Categoria</label>
                                    <input
                                      type="text"
                                      value={publicidadeBottom.category || ""}
                                      onChange={(e) => setPublicidadeBottom({ ...publicidadeBottom, category: e.target.value })}
                                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 md:col-span-2">
                                    <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Título de Destaque</label>
                                    <input
                                      type="text"
                                      value={publicidadeBottom.title || ""}
                                      onChange={(e) => setPublicidadeBottom({ ...publicidadeBottom, title: e.target.value })}
                                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="flex flex-col gap-1 md:col-span-2">
                                    <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Subtítulo Descritivo</label>
                                    <input
                                      type="text"
                                      value={publicidadeBottom.subtitle || ""}
                                      onChange={(e) => setPublicidadeBottom({ ...publicidadeBottom, subtitle: e.target.value })}
                                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Texto do Botão (CTA)</label>
                                    <input
                                      type="text"
                                      value={publicidadeBottom.cta || ""}
                                      onChange={(e) => setPublicidadeBottom({ ...publicidadeBottom, cta: e.target.value })}
                                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch("/api/publicidades/bottom", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            category: publicidadeBottom.category,
                                            title: publicidadeBottom.title,
                                            subtitle: publicidadeBottom.subtitle,
                                            cta: publicidadeBottom.cta,
                                            adminEmail: currentUser?.email || "admin@camara.gov.br"
                                          })
                                        });

                                        if (res.ok) {
                                          const rJson = await res.json();
                                          setPublicidadeBottom(rJson.publicidadeBottom);
                                          triggerToast("Propaganda de rodapé atualizada com sucesso!");
                                        } else {
                                          const errData = await res.json();
                                          triggerToast(errData.message || "Erro ao salvar.", false);
                                        }
                                      } catch {
                                        triggerToast("Erro de conexão.", false);
                                      }
                                    }}
                                    className="bg-[#0b2545] hover:bg-slate-800 text-white font-extrabold px-5 py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer shadow-sm"
                                  >
                                    Salvar Propaganda de Rodapé
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic">Preparando dados de propaganda...</p>
                            )}
                          </div>
                        </div>

                        {/* Custom Authorized Legislative Positions (Cargos da Câmara) */}
                        <div className="border-t pt-6 space-y-4 font-sans text-xs">
                          <div className="border-b pb-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 font-sans" strokeWidth={3} />
                              <span>Gabinete: Cargos Credenciados da Câmara</span>
                            </h4>
                            <p className="text-[10px] text-slate-500">Crie, regulamente ou exclua cargos autorizados eletronicamente para servidores e vereadores no sistema.</p>
                          </div>

                          <form onSubmit={handleCreateCargo} className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end font-sans">
                            <div className="flex flex-col gap-1 col-span-1">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Título do Cargo</label>
                              <input 
                                type="text" 
                                value={addCargoNome}
                                onChange={(e) => setAddCargoNome(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs font-sans font-bold text-slate-805"
                                placeholder="Ex: Assessor de Relações Públicas"
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                              <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Descrição / Regulamentação</label>
                              <input 
                                type="text" 
                                value={addCargoDescricao}
                                onChange={(e) => setAddCargoDescricao(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs font-sans"
                                placeholder="Portaria ou atribuição específica"
                              />
                            </div>
                            <div className="flex gap-2 col-span-1">
                              <button 
                                type="submit"
                                className="flex-1 bg-slate-900 hover:bg-slate-950 text-white font-extrabold px-3 py-2.5 rounded transition shadow flex items-center justify-center gap-1.5 cursor-pointer h-9 text-[11px] uppercase tracking-wide"
                              >
                                {editingCargoId ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Salvar</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Registrar</span>
                                  </>
                                )}
                              </button>
                              {editingCargoId && (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingCargoId(null);
                                    setAddCargoNome("");
                                    setAddCargoDescricao("");
                                  }}
                                  className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-extrabold px-3 py-2.5 rounded transition shadow flex items-center justify-center gap-1.5 cursor-pointer h-9 text-[11px] uppercase tracking-wide"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Cancelar</span>
                                </button>
                              )}
                            </div>
                          </form>

                          <div className="border rounded-lg overflow-x-auto bg-white">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 text-[10px] uppercase">
                                  <th className="px-3 py-2">Cargo</th>
                                  <th className="px-3 py-2">Regulamentação / Atribuições</th>
                                  <th className="px-3 py-2 text-right">Controles</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cargos.map((cargo) => (
                                  <tr key={cargo.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                    <td className="px-3 py-2 font-bold text-slate-800">{cargo.nome}</td>
                                    <td className="px-3 py-2 text-slate-500 font-medium">{cargo.descricao || <span className="italic text-slate-400">Sem formalidades cadastradas</span>}</td>
                                    <td className="px-3 py-2 text-right space-x-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setEditingCargoId(cargo.id);
                                          setAddCargoNome(cargo.nome);
                                          setAddCargoDescricao(cargo.descricao || "");
                                        }}
                                        className="text-sky-600 hover:text-sky-800 font-bold px-2 py-1 text-[10px] uppercase border border-sky-250 bg-sky-50 hover:bg-sky-100 rounded transition cursor-pointer"
                                      >
                                        Editar
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleDeleteCargo(cargo.id)}
                                        className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 text-[10px] uppercase border border-rose-250 bg-rose-50 hover:bg-rose-100 rounded transition cursor-pointer"
                                      >
                                        Excluir
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {cargos.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="px-3 py-4 text-center text-slate-450 italic">
                                      Nenhum cargo registrado no sistema municipal.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                </div>

              </div>
            )}

          </div>
        )}



      </main>

      {/* FOOTER SECTION REGULATED ACCORDING TO LGPD PRIVACY POLICIES */}
      <footer className="bg-slate-900 border-t border-slate-950 py-8 px-6 mt-12 text-slate-400 text-xs" id="municipal-system-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-slate-300 font-bold text-[13px]">OuviVereador IA — Portal Legislativo Municipal de Ouvidoria</p>
            <p className="text-[11px] text-slate-500">Desenvolvido em conformidade integral com a LPGD Lei Geral de Proteção de Dados (Nº 13.709/2018)</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-400">
            <span className="hover:text-white cursor-pointer transition">Políticas de Privacidade</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition">Retenção de Arquivos (60 dias)</span>
            <span>•</span>
            <span className="text-emerald-500">Auditado por IA</span>
          </div>
        </div>
      </footer>


      {/* ======================================= */}
      {/* CADASTRO SUGGESTION / LGPD OFFER MODAL  */}
      {/* ======================================= */}
      {showAuthOfferModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up text-center">
            
            {authOfferStep === "choose" ? (
              <>
                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full h-14 w-14 flex items-center justify-center mx-auto">
                  <UserCheck className="w-8 h-8 text-indigo-600" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-800">Você não se identificou como Cidadão!</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Para que você possa acompanhar e auditar o andamento deste protocolo diretamente da Ouvidoria da Câmara, recomendamos fortemente que faça <strong>Login</strong> ou um <strong>rápido Cadastro</strong>.
                  </p>
                  <p className="text-xs text-slate-600 font-bold bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                    Gostaria de se logar ou cadastrar antes de enviar a mensagem?
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="grid grid-cols-2 gap-2 w-full text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthOfferModal(false);
                        setShowLoginModal(true);
                      }}
                      className="bg-[#0b2545] hover:bg-[#134074] text-white font-extrabold py-3 rounded-lg transition-all focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Fazer Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthOfferModal(false);
                        setShowCadastroModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-lg transition-all focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Cadastrar-se</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAuthOfferModal(false)}
                    className="text-xs text-rose-600 hover:text-rose-800 hover:underline pt-2.5 cursor-pointer font-bold"
                  >
                    Não, cancelar e voltar ao formulário
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-amber-50 text-amber-500 rounded-full h-14 w-14 flex items-center justify-center mx-auto animate-pulse">
                  <HelpCircle className="w-8 h-8 text-amber-600" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-800">Você ainda quer enviar a mensagem?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Caso envie sem logar, você não receberá notificações de trâmite automatizadas em tempo real e precisará salvar seu número de protocolo para realizar consultas manuais.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthOfferModal(false);
                      executeSubmitManifestacao();
                    }}
                    className="bg-[#059669] hover:bg-[#047857] text-white font-extrabold py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                  >
                    <Check className="w-4 h-4" />
                    <span>Sim (Enviar)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthOfferModal(false);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                  >
                    <X className="w-4 h-4" />
                    <span>Não (Não Enviar)</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}


      {/* ======================================= */}
      {/* CADASTRO MODAL (CIDADÃO)                */}
      {/* ======================================= */}
      {showCadastroModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <form onSubmit={handleRegisterCitizen} className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up" id="register-citizen-modal">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800">Criar Nova Conta de Cidadão</h4>
              <button type="button" onClick={() => setShowCadastroModal(false)} className="text-slate-400 hover:text-slate-850">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Nome Completo *</label>
                <input
                  type="text" required
                  value={regNome} onChange={(e) => setRegNome(e.target.value)}
                  className="px-2.5 py-2 border rounded-md"
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Cpf (Opcional) *</label>
                <input
                  type="text"
                  value={regCpf} onChange={(e) => setRegCpf(e.target.value)}
                  className="px-2.5 py-2 border rounded-md"
                  placeholder="Ex: 123.456.789-10"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">E-mail Corporativo/Pessoal *</label>
                <input
                  type="email" required
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  className="px-2.5 py-2 border rounded-md"
                  placeholder="carlos@gmail.com"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Telefone com DDD *</label>
                <input
                  type="text" required
                  value={regTelefone} onChange={(e) => setRegTelefone(e.target.value)}
                  className="px-2.5 py-2 border rounded-md"
                  placeholder="11955555555"
                />
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Senha Pessoal Segura *</label>
                <input
                  type="password" required
                  value={regSenha} onChange={(e) => setRegSenha(e.target.value)}
                  className="px-2.5 py-2 border rounded-md text-xs"
                  placeholder="Sua senha secreta de portal"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Bairro Residencial</label>
                <select
                  value={regBairro} onChange={(e) => setRegBairro(e.target.value)}
                  className="px-2.5 py-2 border rounded-md bg-white text-[11px]"
                >
                  <option value="Centro">Centro</option>
                  <option value="Alagoinhas Velha">Alagoinhas Velha</option>
                  <option value="Silva Jardim">Silva Jardim</option>
                  <option value="Catu">Catu</option>
                  <option value="Santa Terezinha">Santa Terezinha</option>
                  <option value="Kennedy">Kennedy</option>
                  <option value="Barreiro">Barreiro</option>
                  <option value="Petrolar">Petrolar</option>
                  <option value="Juca de Rosa">Juca de Rosa</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Endereço Completo</label>
                <input
                  type="text"
                  value={regEndereco} onChange={(e) => setRegEndereco(e.target.value)}
                  className="px-2.5 py-2 border rounded-md text-xs"
                  placeholder="Ex: Av do Sol, 45"
                />
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border text-[10px] text-emerald-800 leading-relaxed">
              <strong>Proteção LGPD ativa</strong>: Seus dados estão sob absoluto amparo. O e-mail e telefone cadastrados serão usados unicamente para avisar quando suas manifestações enviadas forem lidas ou respondidas.
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button type="button" onClick={() => setShowCadastroModal(false)} className="px-4 py-2 border rounded font-semibold cursor-pointer">
                Cancelar
              </button>
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded font-extrabold cursor-pointer">
                Finalizar Cadastro
              </button>
            </div>

          </form>
        </div>
      )}


      {/* ======================================= */}
      {/* SIGN IN MODAL (ALL ROLES)               */}
      {/* ======================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <form onSubmit={handleLoginSubmit} className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up" id="login-modal-panel">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800">Autenticação no Painel</h4>
              <button type="button" onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-850">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">E-mail de Login ou Telefone</label>
                <input
                  type="text" required
                  value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="px-3 py-2.5 border rounded-lg focus:outline-none focus:border-emerald-600 text-xs font-semibold"
                  placeholder="Ex: admin@camara.gov.br ou 11999999999"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Senha Secreta</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setShowRecuperarModal(true);
                    }}
                    className="text-[10px] text-slate-500 hover:underline hover:text-emerald-700"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password" required
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className="px-3 py-2.5 border rounded-lg focus:outline-none focus:border-emerald-600 text-xs text-slate-800 font-bold"
                  placeholder="Sua senha secreta de acesso"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 border rounded font-semibold cursor-pointer">
                Cancelar
              </button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-black cursor-pointer">
                Entrar
              </button>
            </div>

          </form>
        </div>
      )}


      {/* ======================================= */}
      {/* PASSWORD RECOVERY MODAL                 */}
      {/* ======================================= */}
      {showRecuperarModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <form onSubmit={handleRecoverCredentials} className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800">Recuperar Senha</h4>
              <button type="button" onClick={() => setShowRecuperarModal(false)} className="text-slate-400 hover:text-slate-850">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <label className="font-bold text-slate-600 uppercase text-[10px]">Informe seu e-mail ou telefone cadastrado:</label>
              <input
                type="text" required
                value={recoveryInput} onChange={(e) => setRecoveryInput(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Ex: carlos@gmail.com"
              />
              <p className="text-[10px] text-slate-450">Como este é um MVP, o sistema realizará uma busca nos hashes criptografados e exibirá sua chave de acesso em tela de forma imediata.</p>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button type="button" onClick={() => setShowRecuperarModal(false)} className="px-4 py-2 border rounded font-semibold cursor-pointer">
                Fechar
              </button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded font-black cursor-pointer">
                Recuperar Acesso
              </button>
            </div>

          </form>
        </div>
      )}


      {/* ======================================= */}
      {/* RETRY PASSWORD ON PROVISORY (LGPD REQ)  */}
      {/* ======================================= */}
      {showPasswordRenew && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handlePasswordRenewal} className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-500 space-y-4 animate-scale-up">
            
            <div className="border-b pb-3 space-y-1">
              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">Ação Exclusiva de Primeiro Acesso</span>
              <h4 className="text-sm font-black text-slate-800">Definição Obrigatória de Nova Senha</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Olá! Sua conta administrativa ou de cidadão foi pré-cadastrada pelo Administrador Geral de Câmara. De acordo com as diretrizes e regras de segurança de autenticação do portal, **você deve atualizar sua senha provisória imediatamente primeiro acesso** para sua própria segurança.
            </p>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded border">
                <p>E-mail: <strong>{currentUser?.email}</strong></p>
                <p>Perfil de Acesso: <strong className="text-emerald-700">{currentUser?.perfil}</strong></p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-650 uppercase text-[10px]">Escolha sua Nova Senha Definitiva</label>
                <input
                  type="password" required
                  value={renewPasswordInput} onChange={(e) => setRenewPasswordInput(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-amber-600 text-xs font-bold"
                  placeholder="Escreva sua nova senha"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-450 leading-relaxed border-t pt-3">
              *A senha provisória padrão atribuída anteriormente será invalidada de imediato.
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-lg text-xs font-extrabold cursor-pointer uppercase tracking-wider">
                Gravar Senha Definitiva
              </button>
            </div>

          </form>
        </div>
      )}


      {/* ======================================= */}
      {/* ADMIN LEVEL USER REGISTER (ADMIN ONLY)  */}
      {/* ======================================= */}
      {showUserAddModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleCreateUser} 
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up"
          >
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800">
                {editingUserId ? "Editar Usuário / Servidor" : "Cadastrar Novo Usuário"}
              </h4>
              <button 
                type="button" 
                onClick={() => {
                  setShowUserAddModal(false);
                  setAddUserNome(""); setAddUserEmail(""); setAddUserTelefone(""); setAddUserSenha("mudar123"); setAddUserCargoNome("");
                  setEditingUserId(null);
                }} 
                className="text-slate-400 hover:text-slate-850"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">Nome Completo</label>
                <input
                  type="text" required
                  value={addUserNome} onChange={(e) => setAddUserNome(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white text-slate-800"
                  placeholder="Ex: Assessor de Silva"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">E-mail de Login</label>
                <input
                  type="email" required
                  value={addUserEmail} onChange={(e) => setAddUserEmail(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white text-slate-800"
                  placeholder="assessor@camara.gov.br"
                />
              </div>

              <div className="flex flex-col gap-1 bg-amber-50/50 p-2 rounded border border-amber-250 animate-pulse">
                <label className="font-bold text-amber-800 text-[10px] uppercase flex items-center gap-1">
                  <span>📨 E-mail Alternativo (Obrigatório para Agentes)</span>
                </label>
                <input
                  type="email" required
                  value={addUserEmailAlternativo} onChange={(e) => setAddUserEmailAlternativo(e.target.value)}
                  className="px-2.5 py-2 border border-amber-300 rounded bg-white text-slate-800 font-semibold"
                  placeholder="copia.segurança@camara.gov.br"
                />
                <p className="text-[10px] text-amber-900 leading-normal font-medium">
                  Atenção: É obrigatório cadastrar um e-mail alternativo para o agente receber cópias automáticas de segurança de todos os despachos e mensagens como prova inequívoca de envio legislativo.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">Telefone</label>
                <input
                  type="text" required
                  value={addUserTelefone} onChange={(e) => setAddUserTelefone(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white text-slate-800"
                  placeholder="11911112222"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">Perfil Executivo</label>
                <select
                  value={addUserPerfil} onChange={(e) => setAddUserPerfil(e.target.value as UserPerfil)}
                  className="px-2.5 py-2 border rounded bg-white text-[11px] text-slate-850 font-bold"
                >
                  <option value={UserPerfil.VEREADOR}>Vereador Específico</option>
                  <option value={UserPerfil.OUVIDORIA}>Ouvidoria de Câmara</option>
                  <option value={UserPerfil.ADMIN}>Administrador Geral</option>
                  <option value={UserPerfil.AUDITORIA}>Auditor Executivo</option>
                  <option value={UserPerfil.PROCURADOR}>Procurador da Câmara</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 font-sans">
                <label className="font-bold text-slate-600 text-[10px] uppercase">Cargo Específico (Filiado)</label>
                <select
                  value={addUserCargoNome} onChange={(e) => setAddUserCargoNome(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white text-[11px] font-bold text-slate-850"
                >
                  <option value="">Selecione um cargo oficial...</option>
                  {cargos.map((cg) => (
                    <option key={cg.id} value={cg.nome}>{cg.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase font-mono">
                  {editingUserId ? "Alterar Senha de Segurança (Opcional)" : "Senha Provisória do 1º Acesso"}
                </label>
                <input
                  type="text" 
                  required={!editingUserId}
                  value={addUserSenha} onChange={(e) => setAddUserSenha(e.target.value)}
                  placeholder={editingUserId ? "Deixe em branco para manter a atual" : "Digite a senha inicial"}
                  className="px-2.5 py-1.5 border rounded font-bold font-mono text-xs bg-slate-50 text-slate-700"
                />
              </div>

            </div>

            <div className="bg-slate-50 p-2.5 text-[9.5px] text-slate-500 rounded border">
              *De acordo com as regras municipais, a conta do tipo "{addUserPerfil}" {editingUserId ? "pode ter o perfil e atribuições atualizados a qualquer momento." : "nascerá com flag provisória ativa. O detentor será obrigado a alterá-la para uma senha definitiva de sua livre escolha assim que realizar o login inicial."}
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowUserAddModal(false);
                  setAddUserNome(""); setAddUserEmail(""); setAddUserTelefone(""); setAddUserSenha("mudar123"); setAddUserCargoNome("");
                  setEditingUserId(null);
                }} 
                className="px-4 py-2 border rounded font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button type="submit" className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2 rounded font-extrabold cursor-pointer">
                {editingUserId ? "Salvar Alterações" : "Gravar Conta"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ======================================= */}
      {/* ADMIN VEREADORES / GABINETES ADD MODAL  */}
      {/* ======================================= */}
      {showSecAddModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateSecretaria} className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800">
                {editingSecId ? "Editar Vereador / Gabinete" : "Adicionar Novo Vereador / Gabinete"}
              </h4>
              <button 
                type="button" 
                onClick={() => {
                  setShowSecAddModal(false);
                  setAddSecNome(""); setAddSecEmail(""); setAddSecResp("");
                  setEditingSecId(null);
                }} 
                className="text-slate-400 hover:text-slate-850"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">Nome do Vereador / Gabinete</label>
                <input
                  type="text" required
                  value={addSecNome} onChange={(e) => setAddSecNome(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white"
                  placeholder="Ex: Vereador de Esportes"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">E-mail para Alertas</label>
                <input
                  type="email" required
                  value={addSecEmail} onChange={(e) => setAddSecEmail(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white"
                  placeholder="esportes@camara.gov.br"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600 text-[10px] uppercase">Nome Completo do Vereador</label>
                <input
                  type="text" required
                  value={addSecResp} onChange={(e) => setAddSecResp(e.target.value)}
                  className="px-2.5 py-2 border rounded bg-white"
                  placeholder="Ex: Paulo Souza"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowSecAddModal(false);
                  setAddSecNome(""); setAddSecEmail(""); setAddSecResp("");
                  setEditingSecId(null);
                }} 
                className="px-4 py-2 border rounded font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded font-extrabold cursor-pointer">
                {editingSecId ? "Salvar Alterações" : "Gravar Vereador"}
              </button>
            </div>

          </form>
        </div>
      )}


      {/* ======================================= */}
      {/* EMAIL REPORT TO CITIZEN MODAL           */}
      {/* ======================================= */}
      {showEmailModal && ticketForEmail && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in">
          <form onSubmit={handleConfirmSendEmail} className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 text-emerald-700">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Enviar p/ E-mail</span>
              </h4>
              <button 
                type="button" 
                onClick={() => { setShowEmailModal(false); setTicketForEmail(null); }} 
                className="text-slate-400 hover:text-slate-850 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-500 font-medium">
                Você está enviando o relatório oficial do protocolo <strong className="font-mono text-[#0b2545]">{ticketForEmail.protocolo}</strong> via Ouvidoria Inteligente.
              </p>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Endereço de E-mail Destinatário</label>
                <input
                  type="email" required
                  value={emailDestinatarioLocal} 
                  onChange={(e) => setEmailDestinatarioLocal(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-bold text-xs"
                  placeholder="Ex: seu-email@exemplo.com"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100/70 text-[10px] text-emerald-800 flex items-start gap-2">
                <span className="text-sm">📧</span>
                <p className="leading-relaxed">
                  <strong>Nota de Transparência:</strong> O e-mail conterá o espelho completo de trâmites, classificação IA, observação de vereadores responsáveis e o SLA restante de auditoria técnica.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button 
                type="button" 
                onClick={() => { setShowEmailModal(false); setTicketForEmail(null); }} 
                className="px-4 py-2 border rounded font-semibold cursor-pointer text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSendingEmail}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirmar Envio</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
  // End of email modal
      )}


      {/* ======================================= */}
      {/* OUVINTE GLOBAL FILTERED REPORT MODAL    */}
      {/* ======================================= */}
      {showGlobalReportModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in">
          <form onSubmit={handleSendGlobalReport} className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up text-left">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 text-slate-900">
                <Send className="w-4 h-4 text-sky-500" />
                <span>Transmitir Relatório Consolidado</span>
              </h4>
              <button 
                type="button" 
                onClick={() => { setShowGlobalReportModal(false); setReportEmailDestination(""); }} 
                className="text-slate-400 hover:text-slate-850 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3.5">
              <p className="text-slate-600 font-medium leading-relaxed">
                Você está exportando oficialmente um consolidado contendo <strong className="font-bold text-[#0b2545]">{filteredAdminTickets.length} manifestação(ões) ativa(s)</strong> do painel com base nos filtros atualmente selecionados:
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border text-[10px] space-y-1 text-slate-600 grid grid-cols-2 gap-2">
                <div>• <strong>Bairro:</strong> {adminFilterBairro === "todos" ? "Todos os Setores" : adminFilterBairro}</div>
                <div>• <strong>Situação:</strong> {adminFilterStatus === "todos" ? "Qualquer Status" : adminFilterStatus}</div>
                <div>• <strong>Urgência:</strong> {adminFilterPrioridade === "todos" ? "Todas as prioridades" : adminFilterPrioridade}</div>
                <div>• <strong>Gabinete:</strong> {adminFilterSec === "todos" ? "Todos" : secretarias.find(s => s.id === adminFilterSec)?.nome || adminFilterSec}</div>
                <div className="col-span-2">
                  • <strong>Assunto / Busca:</strong> {adminFilterAssunto || "Nenhum termo ativo"}
                </div>
                <div className="col-span-2">
                  • <strong>Órgão / Destinatário:</strong> {adminFilterOrgao || "Nenhum órgão específico"}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-600 uppercase text-[10px]">E-mail do Destinatário Oficial</label>
                <input
                  type="email" required
                  value={reportEmailDestination} 
                  onChange={(e) => setReportEmailDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-bold text-xs"
                  placeholder="Ex: ouvidoria@sua-camara.gov.br"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[10px] text-amber-900 flex items-start gap-2">
                <span className="text-sm">🛡️</span>
                <p className="leading-relaxed">
                  <strong>Conformidade LGPD:</strong> A geração e o envio de relatórios eletrônicos pela Ouvidoria são auditados e registrados na planilha de auditoria sob os termos da Lei Federal nº 13.709/2018 (Artigo 6º, Princípio da Segurança e Transparência).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button 
                type="button" 
                onClick={() => { setShowGlobalReportModal(false); setReportEmailDestination(""); }} 
                className="px-4 py-2 border rounded font-semibold cursor-pointer text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSendingGlobalReport}
                className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2 rounded-lg font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingGlobalReport ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Transmitindo...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Concluir e Enviar</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}


      {/* PUBLICIDADE DETAIL MODAL: "para as pessoas saberem mais detalhes da notícia" */}
      {activeAdDetail && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-amber-600 max-w-lg w-full p-6 space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-black text-slate-800 flex items-center gap-1.5 uppercase text-xs">
                <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] tracking-wider">INFORMATIVO</span>
                <span>{activeAdDetail.category}</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setActiveAdDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 leading-snug">{activeAdDetail.title}</h3>
              <p className="bg-amber-50/50 p-3 rounded border border-amber-100 text-[11px] text-amber-900 font-bold italic leading-relaxed">
                "{activeAdDetail.highlight}"
              </p>
              
              <div className="text-slate-700 text-xs leading-relaxed space-y-2">
                <p>{activeAdDetail.details}</p>
                <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                  *Esta publicação tem caráter puramente educativo e de interesse social para estreitar laços democráticos com a cidadania.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveAdDetail(null)}
                className="text-slate-500 hover:text-slate-800 font-bold text-xs"
              >
                Retornar ao Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Redirecionamento simulado: Acessando canal oficial de ${activeAdDetail.category}.`);
                  setActiveAdDetail(null);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-black text-xs cursor-pointer shadow-sm transition"
              >
                {activeAdDetail.cta}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ADICIONAR / EDITAR PUBLICIDADE SUPERIOR MODAL */}
      {showTopAdModal && editingTopAd && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-amber-600 max-w-lg w-full p-6 space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-black text-slate-800 flex items-center gap-1.5 uppercase text-xs">
                <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] tracking-wider">MODERADOR</span>
                <span>{editingTopAd.id ? "Editar Informativo Carrossel" : "Cadastrar Novo Informativo"}</span>
              </h4>
              <button 
                type="button" 
                onClick={() => {
                  setShowTopAdModal(false);
                  setEditingTopAd(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Editoria / Categoria</label>
                  <input
                    type="text"
                    value={editingTopAd.category || ""}
                    onChange={(e) => setEditingTopAd({ ...editingTopAd, category: e.target.value })}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                    placeholder="Ex: Transparência Legislativa"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Destaque de Botão (CTA)</label>
                  <input
                    type="text"
                    value={editingTopAd.cta || ""}
                    onChange={(e) => setEditingTopAd({ ...editingTopAd, cta: e.target.value })}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                    placeholder="Ex: Acessar Portal"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Título de Destaque</label>
                <input
                  type="text"
                  value={editingTopAd.title || ""}
                  onChange={(e) => setEditingTopAd({ ...editingTopAd, title: e.target.value })}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                  placeholder="Ex: Novo Refis Municipal Aprovado por Unanimidade"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Subtítulo Resumido (Destaque rápido)</label>
                <input
                  type="text"
                  value={editingTopAd.highlight || ""}
                  onChange={(e) => setEditingTopAd({ ...editingTopAd, highlight: e.target.value })}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                  placeholder="Ex: Até 80% de desconto nos juros moratórios de tributos locais."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Detalhes Completos (Visto ao clicar em 'Saiba Mais')</label>
                <textarea
                  value={editingTopAd.details || ""}
                  onChange={(e) => setEditingTopAd({ ...editingTopAd, details: e.target.value })}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white"
                  placeholder="Digite a narrativa institucional completa e as instruções..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowTopAdModal(false);
                  setEditingTopAd(null);
                }}
                className="text-slate-500 hover:text-slate-800 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingTopAd.category || !editingTopAd.title || !editingTopAd.highlight || !editingTopAd.details || !editingTopAd.cta) {
                    triggerToast("Preencha todos os campos obrigatórios.", false);
                    return;
                  }
                  try {
                    const res = await fetch("/api/publicidades/top", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...editingTopAd,
                        adminEmail: currentUser?.email || "admin@camara.gov.br"
                      })
                    });
                    if (res.ok) {
                      const rJson = await res.json();
                      setPublicidadesTop(rJson.publicidadesTop || []);
                      triggerToast(editingTopAd.id ? "Informativo atualizado!" : "Informativo publicado com sucesso!");
                      setShowTopAdModal(false);
                      setEditingTopAd(null);
                    } else {
                      const errData = await res.json();
                      triggerToast(errData.message || "Erro ao salvar informativos.", false);
                    }
                  } catch {
                    triggerToast("Erro de conexão.", false);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-black text-xs cursor-pointer shadow-sm transition"
              >
                Postar Informativo
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Proof of Delivery / Receipt Certificate dialog */}
      {dispatchProofResult && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-amber-600 max-w-md w-full p-6 space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-black text-rose-950 flex items-center gap-1.5 uppercase text-xs">
                <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9.5px]">CERTIFICADO</span>
                <span>Cópia de Prova Comprobatória</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setDispatchProofResult(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 leading-normal">
                Conforme diretrizes de controle, foi despachado cópias comprobatórias do seu despacho para os e-mails alternativos registrados para atuar como prova civil de encaminhamento municipal:
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border space-y-2 font-mono text-[10px] text-slate-700">
                {dispatchProofResult.copiedSender ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-500 uppercase text-[8.5px]">Cópia remetente (Sua contra-prova):</span>
                    <span className="text-emerald-800 font-bold">✓ Protocolado em: {dispatchProofResult.copiedSender}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-bold text-red-500 uppercase text-[8.5px]">Cópia remetente (Sua contra-prova):</span>
                    <span className="text-red-700 font-medium">⚠️ Não enviada (seu cadastro não possui e-mail alternativo!)</span>
                  </div>
                )}
                {dispatchProofResult.copiedReceiver ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-500 uppercase text-[8.5px]">Cópia destinatário (Notificação):</span>
                    <span className="text-indigo-900 font-bold">✓ Enviada para {dispatchProofResult.copiedReceiver}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-500 uppercase text-[8.5px]">Cópia destinatário (Notificação):</span>
                    <span className="text-slate-500">⚠️ Não enviada (destinatário sem e-mail alternativo)</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <span className="font-bold text-slate-500 uppercase text-[8.5px] block mb-1">Assinaturas e Chaves de segurança:</span>
                  {dispatchProofResult.proofLogs.map((logLine, idx) => (
                    <div key={idx} className="text-slate-800 leading-normal font-semibold">• {logLine}</div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-2.5 rounded text-[9.5px] text-amber-900 border border-amber-105 leading-normal">
                <strong>💡 Nota de Registro:</strong> O e-mail alternativo serve de prova de que você encaminhou a mensagem. Estes metadados foram registrados irrevogavelmente no histórico de logs unificados de cada relato.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDispatchProofResult(null)}
                className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2 rounded-lg font-black text-xs cursor-pointer shadow-sm transition"
              >
                Confirmar Fé de Ofício
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
