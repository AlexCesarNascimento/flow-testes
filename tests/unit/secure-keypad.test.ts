import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUiDump } from '../../src/renderer/src/shared/lib/ui-hierarchy/index.ts';
import {
  findSecureKeypadButton,
  isSecureKeypadVariable,
  validateSecureKeypadPassword,
} from '../../src/renderer/src/features/event-playback/lib/secureKeypad.ts';
import {
  buildRecordingExport,
  parseRecordingImport,
} from '../../src/renderer/src/features/flow-export/index.ts';

const pairs = ['0 ou 1', '2 ou 3', '4 ou 5', '6 ou 7', '8 ou 9'];
function keyboard(labels = pairs) {
  return parseUiDump(
    `<hierarchy>${labels
      .map(
        (label, index) =>
          `<node package="com.test" resource-id="com.test:id/btn${index + 1}" text="${label}" class="android.widget.Button" enabled="true" bounds="[${index * 100},0][${(index + 1) * 100},100]"/>`,
      )
      .join('')}</hierarchy>`,
  );
}

test('senha dinâmica encontra o par do dígito atual sem depender do ID anterior', () => {
  assert.equal(
    findSecureKeypadButton(keyboard(), '1', 'com.test')?.resourceId,
    'com.test:id/btn1',
  );
  assert.equal(
    findSecureKeypadButton(keyboard(pairs.toReversed()), '1', 'com.test')
      ?.resourceId,
    'com.test:id/btn5',
  );
  assert.equal(findSecureKeypadButton(keyboard(), '1', 'outro.app'), null);
});

test('teclado incompleto não toca e pares repetidos falham sem escolha arbitrária', () => {
  assert.equal(findSecureKeypadButton(keyboard(pairs.slice(0, 4)), '1'), null);
  assert.throws(
    () =>
      findSecureKeypadButton(
        keyboard(['0 ou 1', '0 ou 2', '3 ou 4', '5 ou 6', '7 ou 8']),
        '1',
      ),
    /ambíguo/,
  );
  assert.equal(
    findSecureKeypadButton(
      keyboard(['0 ou 1', '2 ou 3', '4 ou 5', '6 ou 7', '8 e 9']),
      '1',
    ),
    null,
  );
});

test('step de senha aceita apenas referência de dataset e nunca exporta senha literal', () => {
  assert.equal(isSecureKeypadVariable('{{senha}}'), true);
  assert.equal(isSecureKeypadVariable('1234'), false);
  assert.equal(validateSecureKeypadPassword('0011'), '0011');
  assert.throws(() => validateSecureKeypadPassword('12a1'), /dígitos/);
  const recording = buildRecordingExport({
    title: 'Teste',
    recordingSeconds: 0,
    device: { displayWidth: 0, displayHeight: 0, name: null },
    steps: [
      {
        id: 1,
        type: 'secureKeypad',
        label: 'Senha',
        value: '{{senha}}',
        time: '--:--',
        selected: false,
        selectors: [],
      },
    ],
  });
  assert.equal(recording.schemaVersion, '1.3.0');
  assert.equal(recording.steps[0].value, '{{senha}}');
  assert.equal(
    parseRecordingImport(JSON.stringify(recording)).steps[0].type,
    'secureKeypad',
  );
  recording.steps[0].value = '1234';
  assert.throws(
    () => parseRecordingImport(JSON.stringify(recording)),
    /senha literal/,
  );
});
