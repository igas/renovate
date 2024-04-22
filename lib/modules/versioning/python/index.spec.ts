import { api as versioning } from '.';

describe('modules/versioning/python/index', () => {
  it.each`
    version                                          | expected
    ${'17.04.00'}                                    | ${true}
    ${'17.b4.0'}                                     | ${false}
    ${'1.2.3'}                                       | ${true}
    ${'1.2.3-foo'}                                   | ${true}
    ${'1.2.3foo'}                                    | ${false}
    ${'1.2.3a0'}                                     | ${true}
    ${'1.2.3b1'}                                     | ${true}
    ${'1.2.3rc23'}                                   | ${true}
    ${'*'}                                           | ${true}
    ${'~1.2.3'}                                      | ${true}
    ${'^1.2.3'}                                      | ${true}
    ${'>1.2.3'}                                      | ${true}
    ${'~=1.9'}                                       | ${true}
    ${'==1.9'}                                       | ${true}
    ${'===1.9.4'}                                    | ${true}
    ${'renovatebot/renovate'}                        | ${false}
    ${'renovatebot/renovate#master'}                 | ${false}
    ${'https://github.com/renovatebot/renovate.git'} | ${false}
  `('isValid("$version") === $expected', ({ version, expected }) => {
    expect(!!versioning.isValid(version)).toBe(expected);
  });

  it.each`
    version      | range                     | expected
    ${'4.2.0'}   | ${'4.2, >= 3.0, < 5.0.0'} | ${true}
    ${'4.2.0'}   | ${'2.0, >= 3.0, < 5.0.0'} | ${false}
    ${'4.2.2'}   | ${'4.2.0, < 4.2.4'}       | ${false}
    ${'4.2.2'}   | ${'^4.2.0, < 4.2.4'}      | ${true}
    ${'4.2.0'}   | ${'4.3.0, 3.0.0'}         | ${false}
    ${'4.2.0'}   | ${'> 5.0.0, <= 6.0.0'}    | ${false}
    ${'4.2.0'}   | ${'*'}                    | ${true}
    ${'1.9.4'}   | ${'==1.9'}                | ${true}
    ${'1.9.4'}   | ${'===1.9.4'}             | ${true}
    ${'1.9.4'}   | ${'===1.9.3'}             | ${false}
    ${'0.8.0a1'} | ${'^0.8.0-alpha.0'}       | ${true}
    ${'0.7.4'}   | ${'^0.8.0-alpha.0'}       | ${false}
    ${'1.4'}     | ${'1.4'}                  | ${true}
    ${'1.4.5'}   | ${'== 1.4.*'}             | ${true}
    ${'1.5.5'}   | ${'== 1.4.*'}             | ${false}
    ${'1.4.5'}   | ${'== 1.4.5'}             | ${true}
    ${'1.4.6'}   | ${'== 1.4.5'}             | ${false}
  `(
    'matches("$version", "$range") === "$expected"',
    ({ version, range, expected }) => {
      expect(versioning.matches(version, range)).toBe(expected);
    },
  );

  it.each`
    version    | range                  | expected
    ${'0.9.0'} | ${'>= 1.0.0 <= 2.0.0'} | ${true}
    ${'1.9.0'} | ${'>= 1.0.0 <= 2.0.0'} | ${false}
    ${'1.9.0'} | ${'== 2.7.*'}          | ${false}
  `(
    'isLessThanRange("$version", "$range") === "$expected"',
    ({ version, range, expected }) => {
      expect(versioning.isLessThanRange?.(version, range)).toBe(expected);
    },
  );

  it.each`
    versions                                         | range                          | expected
    ${['0.4.0', '0.5.0', '4.2.0', '4.3.0', '5.0.0']} | ${'4.*, > 4.2'}                | ${'4.3.0'}
    ${['0.4.0', '0.5.0', '4.2.0', '5.0.0']}          | ${'^4.0.0'}                    | ${'4.2.0'}
    ${['0.4.0', '0.5.0', '4.2.0', '5.0.0']}          | ${'^4.0.0, = 0.5.0'}           | ${null}
    ${['0.4.0', '0.5.0', '4.2.0', '5.0.0']}          | ${'^4.0.0, > 4.1.0, <= 4.3.5'} | ${'4.2.0'}
    ${['0.4.0', '0.5.0', '4.2.0', '5.0.0']}          | ${'^6.2.0, 3.*'}               | ${null}
    ${['0.8.0a2', '0.8.0a7']}                        | ${'^0.8.0-alpha.0'}            | ${'0.8.0-alpha.2'}
    ${['1.0.0', '2.0.0']}                            | ${'^3.0.0'}                    | ${null}
    ${['1.0.0', '2.0.0']}                            | ${'== 3.7.*'}                  | ${null}
  `(
    'minSatisfyingVersion($versions, "$range") === $expected',
    ({ versions, range, expected }) => {
      expect(versioning.minSatisfyingVersion(versions, range)).toBe(expected);
    },
  );

  it.each`
    versions                                                  | range               | expected
    ${['4.2.1', '0.4.0', '0.5.0', '4.0.0', '4.2.0', '5.0.0']} | ${'4.*.0, < 4.2.5'} | ${'4.2.1'}
    ${['0.4.0', '0.5.0', '4.0.0', '4.2.0', '5.0.0', '5.0.3']} | ${'5.0, > 5.0.0'}   | ${'5.0.3'}
    ${['0.8.0a2', '0.8.0a7']}                                 | ${'^0.8.0-alpha.0'} | ${'0.8.0-alpha.7'}
    ${['1.0.0', '2.0.0']}                                     | ${'^3.0.0'}         | ${null}
    ${['1.0.0', '2.0.0']}                                     | ${'== 3.7.*'}       | ${null}
  `(
    'getSatisfyingVersion($versions, "$range") === $expected',
    ({ versions, range, expected }) => {
      expect(versioning.getSatisfyingVersion(versions, range)).toBe(expected);
    },
  );

  it.each`
    currentValue        | rangeStrategy | currentVersion     | newVersion         | expected
    ${'1.0.0'}          | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'1.1.0'}
    ${'   1.0.0'}       | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'1.1.0'}
    ${'1.0.0'}          | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'1.1.0'}
    ${'=1.0.0'}         | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'=  1.0.0'}       | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'= 1.0.0'}        | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'  = 1.0.0'}      | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'  =   1.0.0'}    | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'=    1.0.0'}     | ${'bump'}     | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'^1.0'}           | ${'bump'}     | ${'1.0.0'}         | ${'1.0.7'}         | ${'^1.0.7'}
    ${'^1.0.0'}         | ${'replace'}  | ${'1.0.0'}         | ${'2.0.7'}         | ${'^2.0.0'}
    ${'^5.0.3'}         | ${'replace'}  | ${'5.3.1'}         | ${'5.5'}           | ${'^5.0.3'}
    ${'1.0.0'}          | ${'replace'}  | ${'1.0.0'}         | ${'2.0.7'}         | ${'2.0.7'}
    ${'^1.0.0'}         | ${'replace'}  | ${'1.0.0'}         | ${'2.0.7'}         | ${'^2.0.0'}
    ${'^0.5.15'}        | ${'replace'}  | ${'0.5.15'}        | ${'0.6'}           | ${'^0.5.15'}
    ${'^0.5.15'}        | ${'replace'}  | ${'0.5.15'}        | ${'0.6b.4'}        | ${'^0.5.15'}
    ${'^1'}             | ${'bump'}     | ${'1.0.0'}         | ${'2.1.7'}         | ${'^2.1.7'}
    ${'~1'}             | ${'bump'}     | ${'1.0.0'}         | ${'1.1.7'}         | ${'~1.1.7'}
    ${'5'}              | ${'bump'}     | ${'5.0.0'}         | ${'5.1.7'}         | ${'5.1.7'}
    ${'5'}              | ${'bump'}     | ${'5.0.0'}         | ${'6.1.7'}         | ${'6.1.7'}
    ${'5.0'}            | ${'bump'}     | ${'5.0.0'}         | ${'5.0.7'}         | ${'5.0.7'}
    ${'5.0'}            | ${'bump'}     | ${'5.0.0'}         | ${'5.1.7'}         | ${'5.1.7'}
    ${'5.0'}            | ${'bump'}     | ${'5.0.0'}         | ${'6.1.7'}         | ${'6.1.7'}
    ${'5.0'}            | ${'bump'}     | ${'5.0.0'}         | ${'6.b0.0'}        | ${'5.0'}
    ${'5.0'}            | ${'replace'}  | ${'5.0.0'}         | ${'6.1.7'}         | ${'6.1'}
    ${'=1.0.0'}         | ${'replace'}  | ${'1.0.0'}         | ${'1.1.0'}         | ${'=1.1.0'}
    ${'^1'}             | ${'bump'}     | ${'1.0.0'}         | ${'1.0.7rc.1'}     | ${'^1.0.7-rc.1'}
    ${'^1'}             | ${'bump'}     | ${'1.0.0'}         | ${'1.0.7a0'}       | ${'^1.0.7-alpha.0'}
    ${'^0.8.0-alpha.0'} | ${'bump'}     | ${'0.8.0-alpha.0'} | ${'0.8.0-alpha.1'} | ${'^0.8.0-alpha.1'}
    ${'^0.8.0-alpha.0'} | ${'bump'}     | ${'0.8.0-alpha.0'} | ${'0.8.0a1'}       | ${'^0.8.0-alpha.1'}
    ${'^1.0.0'}         | ${'replace'}  | ${'1.0.0'}         | ${'1.2.3'}         | ${'^1.0.0'}
    ${'~1.0'}           | ${'bump'}     | ${'1.0.0'}         | ${'1.1.7'}         | ${'~1.1.7'}
    ${'1.0.*'}          | ${'replace'}  | ${'1.0.0'}         | ${'1.1.0'}         | ${'1.1.*'}
    ${'1.*'}            | ${'replace'}  | ${'1.0.0'}         | ${'2.1.0'}         | ${'2.*'}
    ${'~0.6.1'}         | ${'replace'}  | ${'0.6.8'}         | ${'0.7.0-rc.2'}    | ${'~0.7.0-rc'}
    ${'<1.3.4'}         | ${'replace'}  | ${'1.2.3'}         | ${'1.5.0'}         | ${'<1.5.1'}
    ${'< 1.3.4'}        | ${'replace'}  | ${'1.2.3'}         | ${'1.5.0'}         | ${'< 1.5.1'}
    ${'<   1.3.4'}      | ${'replace'}  | ${'1.2.3'}         | ${'1.5.0'}         | ${'< 1.5.1'}
    ${'<=1.3.4'}        | ${'replace'}  | ${'1.2.3'}         | ${'1.5.0'}         | ${'<=1.5.0'}
    ${'<= 1.3.4'}       | ${'replace'}  | ${'1.2.3'}         | ${'1.5.0'}         | ${'<= 1.5.0'}
    ${'<=   1.3.4'}     | ${'replace'}  | ${'1.2.3'}         | ${'1.5.0'}         | ${'<= 1.5.0'}
    ${'^1.2'}           | ${'replace'}  | ${'1.2.3'}         | ${'2.0.0'}         | ${'^2.0'}
    ${'^1'}             | ${'replace'}  | ${'1.2.3'}         | ${'2.0.0'}         | ${'^2'}
    ${'~1.2'}           | ${'replace'}  | ${'1.2.3'}         | ${'2.0.0'}         | ${'~2.0'}
    ${'~1'}             | ${'replace'}  | ${'1.2.3'}         | ${'2.0.0'}         | ${'~2'}
    ${'^2.2'}           | ${'widen'}    | ${'2.2.0'}         | ${'3.0.0'}         | ${'^2.2 || ^3.0.0'}
    ${'^2.2 || ^3.0.0'} | ${'widen'}    | ${'3.0.0'}         | ${'4.0.0'}         | ${'^2.2 || ^3.0.0 || ^4.0.0'}
    ${'^3.5'}           | ${'pin'}      | ${'3.5'}           | ${'3.5'}           | ${'3.5'}
  `(
    'getNewValue("$currentValue", "$rangeStrategy", "$currentVersion", "$newVersion") === "$expected"',
    ({ currentValue, rangeStrategy, currentVersion, newVersion, expected }) => {
      const res = versioning.getNewValue({
        currentValue,
        rangeStrategy,
        currentVersion,
        newVersion,
      });
      expect(res).toEqual(expected);
    },
  );
});

it.each`
  a                     | b                     | expected
  ${'1.0.0'}            | ${'1.0.0'}            | ${true}
  ${'1.0.0'}            | ${'>=1.0.0'}          | ${true}
  ${'1.1.0'}            | ${'^1.0.0'}           | ${true}
  ${'>=1.0.0'}          | ${'>=1.0.0'}          | ${true}
  ${'~1.0.0'}           | ${'~1.0.0'}           | ${true}
  ${'^1.0.0'}           | ${'^1.0.0'}           | ${true}
  ${'>=1.0.0'}          | ${'>=1.1.0'}          | ${false}
  ${'~1.0.0'}           | ${'~1.1.0'}           | ${false}
  ${'^1.0.0'}           | ${'^1.1.0'}           | ${false}
  ${'>=1.0.0'}          | ${'<1.0.0'}           | ${false}
  ${'~1.0.0'}           | ${'~0.9.0'}           | ${false}
  ${'^1.0.0'}           | ${'^0.9.0'}           | ${false}
  ${'^1.1.0 || ^2.0.0'} | ${'^1.0.0 || ^2.0.0'} | ${true}
  ${'^1.0.0 || ^2.0.0'} | ${'^1.1.0 || ^2.0.0'} | ${false}
  ${'1.2.3foo'}         | ${'~1.1.0'}           | ${undefined}
`('subset("$a", "$b") === $expected', ({ a, b, expected }) => {
  expect(versioning.subset!(a, b)).toBe(expected);
});
