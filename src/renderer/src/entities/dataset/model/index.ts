export type DatasetRow = {
  id: string;
  active: boolean;
  login: string;
  senha: string;
  saudacao: string;
  tipo: string;
};

export const MOCK_DATASET_ROWS: DatasetRow[] = [
  {
    id: 'cliente_01',
    active: true,
    login: 'alex@email.com',
    senha: '••••••••••',
    saudacao: 'Olá, Alex',
    tipo: 'varejo',
  },
  {
    id: 'cliente_02',
    active: true,
    login: 'maria@email.com',
    senha: '••••••••••',
    saudacao: 'Olá, Maria',
    tipo: 'uniclass',
  },
  {
    id: 'cliente_03',
    active: true,
    login: 'carla@email.com',
    senha: '••••••••••',
    saudacao: 'Olá, Carla',
    tipo: 'varejo',
  },
];
