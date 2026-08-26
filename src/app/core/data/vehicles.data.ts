import type { VehicleType } from '../models';

/** Vehicle categories accepted at the workshop. */
export const VEHICLE_TYPES: readonly VehicleType[] = [
  {
    id: 'ligeiros',
    label: 'Carros Ligeiros',
    image: 'images/vehicles/ligeiros.png',
    description: 'Utilitários e familiares de todas as marcas.',
  },
  {
    id: 'comerciais',
    label: 'Vans e Comerciais Ligeiros',
    image: 'images/vehicles/comerciais.png',
    description: 'Frotas e viaturas de trabalho até 3,5 t.',
  },
  {
    id: 'todo-o-terreno',
    label: 'Todo-o-Terreno',
    image: 'images/vehicles/todo-o-terreno.png',
    description: 'SUV e 4x4, incluindo tração integral.',
  },
  {
    id: 'classicos',
    label: 'Carros Clássicos',
    image: 'images/vehicles/classicos.png',
    description: 'Restauro e manutenção com o devido cuidado.',
  },
  {
    id: 'desportivos',
    label: 'Super Desportivos',
    image: 'images/vehicles/desportivos.png',
    description: 'Alta performance com peças e ferramenta próprias.',
  },
];
