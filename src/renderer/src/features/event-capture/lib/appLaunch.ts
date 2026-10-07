import type { Step } from '../../../entities/step/index.ts';

/** Pacote observado no app de destino; nunca infere package a partir do nome do ícone. */
export function appLaunchPatch(
  fromLauncher: boolean,
  sourcePackage: string,
  destinationPackage: string,
): Partial<Step> | null {
  if (
    !fromLauncher ||
    destinationPackage === sourcePackage ||
    !/^[a-zA-Z][\w]*(?:\.[\w]+)+$/.test(destinationPackage) ||
    destinationPackage === 'com.android.systemui'
  )
    return null;
  return {
    type: 'launchApp',
    label: `Abrir app ${destinationPackage}`,
    value: destinationPackage,
    selectors: [],
    pending: false,
  };
}
