import { teethToPD } from "./math";

export default function CheatSheet() {
  const Pulley = (vendor, chain, teeth, bore, wrong = false) => {
    return {
      vendor,
      chain,
      teeth,
      bore,
      pd: teethToPD(teeth, chain).to("in").scalar.toFixed(3),
      wrong,
    };
  };

  const data = [
    Pulley("REV", "#25", 10, "NEO/CIM (8mm)"),
    Pulley("VEXPro, WCP, AndyMark", "#25", 16, '3/8" Hex', true),
    Pulley("VEXPro, WCP", "#25", 18, '3/8" Hex', true),
    Pulley("VEXPro, WCP", "#25", 22, '3/8" Hex', true),
    Pulley("AndyMark", "#25", 24, '3/8" Hex'),

    Pulley("VEXPro, WCP, AndyMark", "#25", 16, '1/2" Hex', true),
    Pulley("AndyMark", "#25", 17, '1/2" Hex'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 18, '1/2" Hex', true),
    Pulley("VEXPro, WCP, AndyMark", "#25", 22, '1/2" Hex', true),
    Pulley("AndyMark", "#25", 24, '1/2" Hex'),

    Pulley("VEXPro, WCP, AndyMark", "#25", 16, '1/2" ID', true),
    Pulley("AndyMark", "#25", 18, '1/2" ID'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 22, '1/2" ID', true),
    Pulley("AndyMark", "#25", 24, '1/2" ID'),

    Pulley("VEXPro, WCP, AndyMark", "#25", 32, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 34, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 36, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 38, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 40, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 42, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP", "#25", 44, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 48, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 54, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP", "#25", 58, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 60, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP", "#25", 64, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 66, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP", "#25", 72, '1-1/8" Bearing Bore'),

    Pulley("VEXPro, WCP", "#35", 12, '1/2" Hex'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 15, '1/2" Hex'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 12, '1/2" ID'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 15, '1/2" ID'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 22, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 24, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 26, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 28, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 30, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 32, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP", "#35", 33, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 36, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 42, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP", "#35", 44, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 48, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 54, '1-1/8" Bearing Bore'),
    Pulley("VEXPro, WCP, AndyMark", "#35", 60, '1-1/8" Bearing Bore'),
  ];

  return (
    <>
      <table className="table is-hoverable is-narrow">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Chain</th>
            <th>Teeth</th>
            <th>Bore</th>
            <th>
              <abbr title="Pitch Diameter">PD</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((pulley) => {
            let pdText = <>{pulley.pd}&quot;</>;
            if (pulley.wrong) {
              pdText = <i>{pdText}</i>;
            }

            return (
              <tr
                key={
                  pulley.vendor +
                  pulley.teeth +
                  pulley.bore +
                  pulley.type +
                  pulley.chain
                }
              >
                <td>{pulley.vendor}</td>
                <td>{pulley.chain}</td>
                <td>{pulley.teeth}T</td>
                <td>{pulley.bore}</td>
                <td>{pdText}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
