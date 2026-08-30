// src/app/core/data/about.data.ts
var BRAND_VALUES = [
  {
    icon: "shield-check",
    title: "Qualidade comprovada",
    description: "Pe\xE7as dentro da especifica\xE7\xE3o do fabricante e trabalho verificado antes de entregar a viatura."
  },
  {
    icon: "gauge",
    title: "Efici\xEAncia",
    description: "Diagn\xF3stico ao primeiro dia e prazos que cumprimos, para ficar sem carro o menor tempo poss\xEDvel."
  },
  {
    icon: "quote",
    title: "Atendimento personalizado",
    description: "Explicamos o que precisa de ser feito, o que pode esperar e quanto custa \u2014 antes de come\xE7ar."
  }
];
var ABOUT_STORY = [
  {
    icon: "wrench",
    title: "Uma oficina, uma equipa",
    description: "Somos uma equipa pequena e est\xE1vel: quem recebe a sua viatura \xE9 quem trabalha nela e quem lhe explica o que foi feito. Sem intermedi\xE1rios e sem respostas vagas."
  },
  {
    icon: "star",
    title: "O cliente no centro",
    description: "Desde a nossa funda\xE7\xE3o, o foco \xE9 garantir a satisfa\xE7\xE3o dos clientes com servi\xE7os personalizados e eficientes para todos os tipos de ve\xEDculos."
  },
  {
    icon: "cpu",
    title: "Tecnologia de ponta",
    description: "Investimos continuamente em equipamento e nas melhores pr\xE1ticas do setor para oferecer solu\xE7\xF5es inovadoras e seguras."
  },
  {
    icon: "shield-check",
    title: "Confian\xE7a e transpar\xEAncia",
    description: "Seja para uma simples manuten\xE7\xE3o ou uma repara\xE7\xE3o complexa, pode confiar em n\xF3s para cuidar do seu ve\xEDculo com profissionalismo e transpar\xEAncia."
  }
];
var AMENITIES = [
  {
    icon: "parking",
    title: "Parque para Clientes",
    description: "Estacionamento seguro e acess\xEDvel junto \xE0 oficina."
  },
  {
    icon: "sofa",
    title: "Sala de Espera",
    description: "Espa\xE7o confort\xE1vel para aguardar enquanto cuidamos do seu ve\xEDculo."
  }
];

// src/app/core/data/gallery.data.ts
var RESPONSIVE_WIDTHS = [480, 768, 1200];
var workshopPhoto = (index, alt, caption) => ({
  src: `images/workshop/oficina-${index}.jpg`,
  alt,
  caption,
  width: 1920,
  height: 1080,
  widths: RESPONSIVE_WIDTHS
});
var WORKSHOP_GALLERY = [
  workshopPhoto(1, "Interior da oficina FS Automotive com viaturas em manuten\xE7\xE3o", "A nossa oficina em Vialonga"),
  workshopPhoto(2, "\xC1rea de trabalho da FS Automotive com equipamento de diagn\xF3stico", "Equipamento de diagn\xF3stico multimarca"),
  workshopPhoto(3, "Viatura elevada num dos elevadores da FS Automotive", "Elevadores para interven\xE7\xF5es em seguran\xE7a"),
  workshopPhoto(4, "Espa\xE7o de rece\xE7\xE3o e sala de espera para clientes da FS Automotive", "Rece\xE7\xE3o e sala de espera para clientes"),
  workshopPhoto(5, "Bancada de ferramentas da oficina FS Automotive", "Bancada e ferramenta especializada"),
  workshopPhoto(6, "Vista geral das instala\xE7\xF5es da FS Automotive", "Instala\xE7\xF5es FS Automotive")
];
var HERO_SLIDES = [
  WORKSHOP_GALLERY[0],
  WORKSHOP_GALLERY[2],
  WORKSHOP_GALLERY[5]
];

// src/app/core/data/navigation.data.ts
var NAV_LINKS = [
  { label: "In\xEDcio", shortLabel: "In\xEDcio", path: "/", icon: "home", exact: true },
  { label: "Sobre N\xF3s", shortLabel: "Sobre", path: "/sobre-nos", icon: "info" },
  { label: "Servi\xE7os", shortLabel: "Servi\xE7os", path: "/servicos", icon: "wrench" },
  { label: "Contactos", shortLabel: "Contactos", path: "/contactos", icon: "phone" }
];

// src/app/core/data/vehicles.data.ts
var VEHICLE_TYPES = [
  {
    id: "ligeiros",
    label: "Carros Ligeiros",
    image: "images/vehicles/ligeiros.png",
    description: "Utilit\xE1rios e familiares de todas as marcas."
  },
  {
    id: "comerciais",
    label: "Vans e Comerciais Ligeiros",
    image: "images/vehicles/comerciais.png",
    description: "Frotas e viaturas de trabalho at\xE9 3,5 t."
  },
  {
    id: "todo-o-terreno",
    label: "Todo-o-Terreno",
    image: "images/vehicles/todo-o-terreno.png",
    description: "SUV e 4x4, incluindo tra\xE7\xE3o integral."
  },
  {
    id: "classicos",
    label: "Carros Cl\xE1ssicos",
    image: "images/vehicles/classicos.png",
    description: "Restauro e manuten\xE7\xE3o com o devido cuidado."
  },
  {
    id: "desportivos",
    label: "Super Desportivos",
    image: "images/vehicles/desportivos.png",
    description: "Alta performance com pe\xE7as e ferramenta pr\xF3prias."
  }
];

export {
  BRAND_VALUES,
  ABOUT_STORY,
  AMENITIES,
  WORKSHOP_GALLERY,
  HERO_SLIDES,
  NAV_LINKS,
  VEHICLE_TYPES
};
//# sourceMappingURL=chunk-H4LGSLFV.js.map
