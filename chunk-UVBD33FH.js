import {
  DOCUMENT,
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  isPlatformBrowser,
  setClassMetadata,
  signal,
  ɵɵdefineInjectable
} from "./chunk-RUFDRP5X.js";

// src/app/core/data/services.data.ts
var SERVICES = [
  {
    id: "servicos-rapidos",
    title: "Servi\xE7os R\xE1pidos",
    description: "Manuten\xE7\xE3o corrente resolvida no pr\xF3prio dia, sem marca\xE7\xF5es demoradas nem imprevistos.",
    icon: "gauge",
    highlights: [
      "Troca de pastilhas e discos de trav\xE3o",
      "Mudan\xE7a de \xF3leo e filtros",
      "Substitui\xE7\xE3o e teste de baterias",
      "Carregamento de ar condicionado"
    ]
  },
  {
    id: "pintura-carrocaria",
    title: "Pintura e Carro\xE7aria",
    description: "Repara\xE7\xE3o e acabamento com correspond\xEAncia de cor de f\xE1brica, do pequeno retoque \xE0 personaliza\xE7\xE3o completa.",
    icon: "palette",
    highlights: [
      "Retoques e repara\xE7\xE3o de riscos",
      "Repara\xE7\xE3o de danos de colis\xE3o",
      "Polimento e tratamento de far\xF3is",
      "Personaliza\xE7\xE3o e pintura integral"
    ]
  },
  {
    id: "mecanica-especializada",
    title: "Mec\xE2nica Especializada",
    description: "Interven\xE7\xF5es de fundo no motor e na transmiss\xE3o, executadas por t\xE9cnicos com experi\xEAncia multimarca.",
    icon: "wrench",
    highlights: [
      "Motor: distribui\xE7\xE3o, juntas e revis\xF5es",
      "Embraiagem e caixas autom\xE1ticas",
      "Sistemas de inje\xE7\xE3o diesel e gasolina",
      "Amortecedores, dire\xE7\xE3o e suspens\xE3o"
    ]
  },
  {
    id: "eletricidade-eletronica",
    title: "Eletricidade e Eletr\xF3nica",
    description: "Diagn\xF3stico e repara\xE7\xE3o dos sistemas el\xE9tricos e eletr\xF3nicos que hoje comandam quase todo o ve\xEDculo.",
    icon: "zap",
    highlights: [
      "Avarias el\xE9tricas e curto-circuitos",
      "Alternadores, motores de arranque e cablagens",
      "Sensores, centralinas e m\xF3dulos",
      "Ilumina\xE7\xE3o e sistemas de conforto"
    ]
  },
  {
    id: "diagnostico-computorizado",
    title: "Diagn\xF3stico Computorizado",
    description: "Leitura de erros com equipamento multimarca para identificar a causa antes de trocar qualquer pe\xE7a.",
    icon: "cpu",
    highlights: [
      "Leitura e an\xE1lise de c\xF3digos de avaria",
      "Testes din\xE2micos em estrada",
      "Regenera\xE7\xE3o e verifica\xE7\xE3o de filtro de part\xEDculas",
      "Relat\xF3rio claro antes de qualquer interven\xE7\xE3o"
    ]
  },
  {
    id: "pneus",
    title: "Pneus",
    description: "Montagem, equilibragem e alinhamento com medi\xE7\xE3o de geometria \u2014 seguran\xE7a e travagem no ponto certo.",
    icon: "disc",
    highlights: [
      "Substitui\xE7\xE3o de pneus de todas as medidas",
      "Equilibragem eletr\xF3nica",
      "Alinhamento de dire\xE7\xE3o e geometria",
      "Repara\xE7\xE3o de furos e verifica\xE7\xE3o de press\xF5es"
    ]
  },
  {
    id: "reparacao-pos-colisao",
    title: "Repara\xE7\xE3o P\xF3s-Colis\xE3o",
    description: "Restauro completo de ve\xEDculos acidentados, com acompanhamento do processo do in\xEDcio ao fim.",
    icon: "shield-check",
    highlights: [
      "Avalia\xE7\xE3o e or\xE7amento detalhado do dano",
      "Endireitamento de estrutura e chapa",
      "Substitui\xE7\xE3o de pain\xE9is e vidros",
      "Apoio na comunica\xE7\xE3o com a seguradora"
    ]
  },
  {
    id: "escapes-exaustao",
    title: "Escapes e Exaust\xE3o",
    description: "Manuten\xE7\xE3o e substitui\xE7\xE3o da linha de escape para recuperar desempenho, consumo e sil\xEAncio.",
    icon: "wind",
    highlights: [
      "Substitui\xE7\xE3o de silenciosos e tubagens",
      "Catalisadores e sondas lambda",
      "Filtro de part\xEDculas (FAP/DPF)",
      "Dete\xE7\xE3o e corre\xE7\xE3o de fugas"
    ]
  },
  {
    id: "lubrificantes-oleo",
    title: "Lubrificantes e Mudan\xE7a de \xD3leo",
    description: "\xD3leos e filtros dentro da especifica\xE7\xE3o do fabricante, com registo do plano de manuten\xE7\xE3o.",
    icon: "droplet",
    highlights: [
      "\xD3leo de motor conforme especifica\xE7\xE3o",
      "Filtros de \xF3leo, ar, combust\xEDvel e habit\xE1culo",
      "\xD3leo de caixa e trav\xF5es",
      "Registo e aviso da pr\xF3xima revis\xE3o"
    ]
  },
  {
    id: "pre-inspecao",
    title: "Pr\xE9-Inspe\xE7\xE3o",
    description: "Verifica\xE7\xE3o completa antes da inspe\xE7\xE3o obrigat\xF3ria, para chegar ao centro com tudo conforme.",
    icon: "clipboard-check",
    highlights: [
      "Travagem, suspens\xE3o e dire\xE7\xE3o",
      "Luzes, sinaliza\xE7\xE3o e pneus",
      "Emiss\xF5es de gases",
      "Corre\xE7\xE3o das reprova\xE7\xF5es antes da inspe\xE7\xE3o"
    ]
  }
];

// src/app/core/data/site.data.ts
var SITE = {
  name: "FS Automotive",
  legalName: "FS Automotive",
  tagline: "Oficina multimarca em Vialonga",
  description: "Oficina autom\xF3vel multimarca em Vialonga. Mec\xE2nica especializada, diagn\xF3stico computorizado, pintura e carro\xE7aria, pneus e pr\xE9-inspe\xE7\xE3o \u2014 com atendimento personalizado e transpar\xEAncia total.",
  owner: "Miguel Faria",
  url: "https://fsautomotive.pt",
  foundedYear: 2019,
  logo: "images/brand/logo-fs-automotive.png",
  squareLogo: "images/brand/logo-fs-automotive-square.png",
  phone: {
    display: "(+351) 933 678 865",
    href: "tel:+351933678865",
    e164: "+351933678865"
  },
  email: "fsautomotive.servicos@gmail.com",
  address: {
    street: "Rua do Olival Santo 16b",
    postalCode: "2625-585",
    city: "Vialonga",
    country: "Portugal",
    countryCode: "PT",
    latitude: 38.882677,
    longitude: -9.072793,
    directionsUrl: "https://maps.app.goo.gl/popbTDGsMqgfEiqD6",
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3101.762091871784!2d-9.072793624219933!3d38.88267764757284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd192f00582e9d45%3A0xe4bd238f46d9a5a8!2sTOPCAR%20-%20FS%20Automotive!5e1!3m2!1spt-PT!2spt!4v1743278960709!5m2!1spt-PT!2spt"
  },
  socials: [
    {
      label: "Facebook",
      href: "https://www.facebook.com/people/FSautomotive/100057153442586/",
      icon: "facebook"
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/fs.automotive.oficina/",
      icon: "instagram"
    },
    {
      label: "E-mail",
      href: "mailto:fsautomotive.servicos@gmail.com",
      icon: "mail"
    }
  ]
};
var CALL_ACTION = {
  label: SITE.phone.display,
  icon: "phone",
  href: SITE.phone.href,
  ariaLabel: `Ligar para a FS Automotive: ${SITE.phone.display}`
};
var EMAIL_ACTION = {
  label: "Enviar e-mail",
  icon: "mail",
  href: `mailto:${SITE.email}`,
  ariaLabel: `Enviar e-mail para ${SITE.email}`
};
var DIRECTIONS_ACTION = {
  label: "Como chegar",
  icon: "map-pin",
  href: SITE.address.directionsUrl,
  external: true,
  ariaLabel: "Abrir a morada da FS Automotive no Google Maps"
};

// src/app/core/data/opening-hours.data.ts
var OPENING_HOURS = [
  {
    days: "Segunda a Sexta-feira",
    periods: ["08:30 \u2013 13:00", "14:30 \u2013 18:30"],
    closed: false,
    schemaDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    schemaOpens: ["08:30", "14:30"],
    schemaCloses: ["13:00", "18:30"]
  },
  {
    days: "S\xE1bado",
    periods: [],
    closed: true,
    schemaDays: ["Saturday"]
  },
  {
    days: "Domingo e Feriados",
    periods: [],
    closed: true,
    schemaDays: ["Sunday"]
  }
];

// src/app/core/services/consent.service.ts
var CONSENT_STORAGE_KEY = "fsautomotive:analytics-consent";
var DECISIONS = ["unknown", "accepted", "declined"];
var ConsentService = class _ConsentService {
  document = inject(DOCUMENT);
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  decision = signal(this.read(), ...ngDevMode ? [{ debugName: "decision" }] : (
    /* istanbul ignore next */
    []
  ));
  /** The stored decision. `unknown` until the visitor answers the notice. */
  value = this.decision.asReadonly();
  /** `true` while the notice should be on screen. */
  needsNotice = computed(() => this.decision() === "unknown", ...ngDevMode ? [{ debugName: "needsNotice" }] : (
    /* istanbul ignore next */
    []
  ));
  /** `false` only after an explicit refusal — see the class comment. */
  analyticsAllowed = computed(() => this.decision() !== "declined", ...ngDevMode ? [{ debugName: "analyticsAllowed" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Accepts anonymous measurement and dismisses the notice. */
  accept() {
    this.write("accepted");
  }
  /**
   * Refuses measurement, for this visit and every later one.
   *
   * Analytics stops sending immediately. gtag.js may already have loaded, and
   * a script cannot be unloaded — but it has set nothing (all storage denied),
   * and every later event is dropped before it reaches gtag.
   */
  decline() {
    this.write("declined");
  }
  /**
   * Forgets the decision, so the notice is shown again on the next load.
   *
   * There is no UI for this yet; it exists so a "change your preference" link
   * can be added without reopening this service, and so tests can start clean.
   */
  reset() {
    this.decision.set("unknown");
    this.withStorage((storage) => storage.removeItem(CONSENT_STORAGE_KEY));
  }
  write(decision) {
    this.decision.set(decision);
    this.withStorage((storage) => storage.setItem(CONSENT_STORAGE_KEY, decision));
  }
  read() {
    const stored = this.withStorage((storage) => storage.getItem(CONSENT_STORAGE_KEY));
    return DECISIONS.find((decision) => decision === stored) ?? "unknown";
  }
  /**
   * Runs a storage operation, or gives up quietly.
   *
   * Reading `localStorage` *throws* rather than returning null when a browser
   * is set to block site data, and again in Safari's private mode. A privacy
   * notice that crashes the page for the most privacy-conscious visitors would
   * be a poor joke, so every access is guarded.
   */
  withStorage(operation) {
    if (!this.isBrowser) {
      return void 0;
    }
    try {
      const storage = this.document.defaultView?.localStorage;
      return storage ? operation(storage) : void 0;
    } catch {
      return void 0;
    }
  }
  static \u0275fac = function ConsentService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ConsentService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ConsentService, factory: _ConsentService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ConsentService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], null, null);
})();

export {
  OPENING_HOURS,
  SERVICES,
  SITE,
  CALL_ACTION,
  EMAIL_ACTION,
  DIRECTIONS_ACTION,
  ConsentService
};
//# sourceMappingURL=chunk-UVBD33FH.js.map
