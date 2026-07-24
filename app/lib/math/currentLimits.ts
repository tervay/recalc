import Measurement from '~/lib/models/Measurement';

export function getvAppliedMinAndMax({
  resistance,
  iMaxStator,
  iMaxSupply,
  vBackEmf,
  vSupply,
}: {
  resistance: Measurement;
  iMaxStator: Measurement;
  iMaxSupply: Measurement;
  vBackEmf: Measurement;
  vSupply: Measurement;
}): {
  vAppliedMin: Measurement;
  vAppliedMax: Measurement;
} {
  const minATerm = vBackEmf.sub(iMaxStator.mul(resistance));
  const maxATerm = vBackEmf.add(iMaxStator.mul(resistance));

  const toSqrt = vBackEmf
    .mul(vBackEmf)
    .div(4)
    .add(iMaxSupply.mul(resistance).mul(vSupply));
  const sqrted = new Measurement(Math.sqrt(toSqrt.to('V^2').scalar), 'V');

  const minBTerm = vBackEmf.div(2).sub(sqrted);
  const maxBTerm = vBackEmf.div(2).add(sqrted);

  const min = Measurement.max(minATerm, minBTerm);
  const max = Measurement.min(maxATerm, maxBTerm);

  return {
    vAppliedMin: min,
    vAppliedMax: max,
  };
}
