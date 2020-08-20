import React from "react";

import { teethToPD } from "./math";

export default function CheatSheet() {
  const Pulley = (vendor, chain, teeth, bore) => {
    return {
      vendor,
      chain,
      teeth,
      bore,
      pd: teethToPD(teeth, chain).to("in").scalar.toFixed(3),
    };
  };

  const data = [
    Pulley("VEXPro, WCP, AndyMark", "#25", 16, '3/8" Hex'),
    Pulley("VEXPro, WCP", "#25", 18, '3/8" Hex'),
    Pulley("VEXPro, WCP", "#25", 22, '3/8" Hex'),
    Pulley("AndyMark", "#25", 24, '3/8" Hex'),

    Pulley("VEXPro, WCP, AndyMark", "#25", 16, '1/2" Hex'),
    Pulley("AndyMark", "#25", 17, '1/2" Hex'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 18, '1/2" Hex'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 22, '1/2" Hex'),
    Pulley("AndyMark", "#25", 24, '1/2" Hex'),

    Pulley("VEXPro, WCP, AndyMark", "#25", 16, '1/2" ID'),
    Pulley("AndyMark", "#25", 18, '1/2" ID'),
    Pulley("VEXPro, WCP, AndyMark", "#25", 22, '1/2" ID'),
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
      <article className="message is-warning">
        <div className="message-header">
          <p>Warning</p>
        </div>
        <div className="message-body">
          VEX has listed the pitch diameter for their #25 chain hex bore &
          1/2&quot; ID sprockets to be slightly less than the formula for a
          sprocket&apos;s pitch diameter. However, their pitch diameters for
          their #25 chain plate sprockets are in agreement with the formula. We
          have published the pitch diameters according to the formula for the
          former group of sprockets. You can view VEX&apos;s numbers{" "}
          <a href="https://content.vexrobotics.com/vexpro/pdf/VEXpro-%2325HubSprockets-20171130.PDF">
            on their site.
          </a>
        </div>
      </article>
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
                <td>{pulley.pd}&quot;</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
