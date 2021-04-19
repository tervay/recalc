import Measurement from "common/models/Measurement";
import { teethToPD } from "web/calculators/belts/math";

const WCP_HTD =
  "https://www.wcproducts.com/belts-chain-gears/belts-pulleys/htd-timing-pulleys-896";
const WCP_GT2 =
  "https://www.wcproducts.com/belts-chain-gears/belts-pulleys/gt2-timing-pulleys";
const WCP_HTD_VERSA =
  "https://www.wcproducts.com/belts-chain-gears/belts-pulleys/htd-versa-pulleys-896";

const VEX_HTD = "https://www.vexrobotics.com/htdpulleys.html";
const VEX_GT2 = "https://www.vexrobotics.com/gt2pulleys.html";
const VEX_HTD_VERSA = "https://www.vexrobotics.com/htdversapulley.html";

export default function CheatSheet() {
  const Pulley = (vendors, type, pitch, width, teeth, bore) => {
    return {
      vendors,
      type,
      pitch,
      width,
      teeth,
      bore,
      pd: teethToPD(teeth, new Measurement(pitch, "mm"), "in"),
    };
  };
  const Vendor = (name, url = null) => {
    return { name, url };
  };

  const data = [
    Pulley([Vendor("VEXpro", VEX_GT2)], "GT2", 3, 9, 12, "RS550"),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      12,
      "RS775"
    ),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      12,
      "BAG"
    ),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      16,
      "Falcon"
    ),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      24,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      36,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      48,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_GT2), Vendor("WCP", WCP_GT2)],
      "GT2",
      3,
      9,
      60,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_HTD), Vendor("WCP", WCP_HTD)],
      "HTD",
      5,
      "9, 15",
      18,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_HTD), Vendor("WCP", WCP_HTD)],
      "HTD",
      5,
      "9, 15",
      24,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_HTD), Vendor("WCP", WCP_HTD)],
      "HTD",
      5,
      "9, 15",
      30,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_HTD), Vendor("WCP", WCP_HTD)],
      "HTD",
      5,
      "9, 15",
      36,
      '1/2" Hex'
    ),
    Pulley(
      [Vendor("VEXpro", VEX_HTD_VERSA), Vendor("WCP", WCP_HTD_VERSA)],
      "HTD",
      5,
      "7, 18",
      42,
      "VersaKey"
    ),
    Pulley(
      [Vendor("VEXpro", VEX_HTD_VERSA), Vendor("WCP", WCP_HTD_VERSA)],
      "HTD",
      5,
      "7, 18",
      60,
      "VersaKey"
    ),
    Pulley([Vendor("WCP", WCP_HTD)], "HTD", 5, "9, 15", 12, "NEO/CIM (8mm)"),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/12-tooth-5mm-htd-cim-bore-pulley-with-flanges"
        ),
      ],
      "HTD",
      5,
      9,
      12,
      "NEO/CIM (8mm)"
    ),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/24t-htd-pulley-1-2-in-hex-bore"
        ),
      ],
      "HTD",
      5,
      9,
      24,
      '1/2" Hex'
    ),
    Pulley([Vendor("AndyMark")], "HTD", 5, 9, 24, '3/8" Hex'),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/24t-htd-pulley-6mm-bore"
        ),
      ],
      "HTD",
      5,
      9,
      24,
      "6mm"
    ),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/30-tooth-htd-pulley"
        ),
      ],
      "HTD",
      5,
      9,
      30,
      "NEO/CIM (8mm)"
    ),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/39-tooth-htd-plastic-drive-pulley-kit-with-hex-hub"
        ),
      ],
      "HTD",
      5,
      15,
      39,
      '1/2" Hex'
    ),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/39-tooth-htd-plastic-drive-pulley-kit"
        ),
      ],
      "HTD",
      5,
      15,
      39,
      '1/2" Round'
    ),
    Pulley(
      [
        Vendor(
          "AndyMark",
          "https://www.andymark.com/products/42-tooth-htd-pulley"
        ),
      ],
      "HTD",
      5,
      15,
      42,
      '0.95"'
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/neo-pinions/")],
      "GT2",
      3,
      21.4,
      16,
      "NEO/CIM (8mm)"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/550-motor-pinions/")],
      "GT2",
      3,
      11.9,
      12,
      "RS550"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/rev-41-1668/")],
      "GT2",
      3,
      15,
      12,
      "5mm Hex"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/rev-45-1823/")],
      "GT2",
      3,
      5,
      24,
      "5mm Hex, 16mm Bolt Circle"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/rev-45-1823/")],
      "GT2",
      3,
      5,
      30,
      "5mm Hex, 16mm Bolt Circle"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/rev-45-1823/")],
      "GT2",
      3,
      5,
      36,
      "5mm Hex, 16mm Bolt Circle"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/rev-45-1823/")],
      "GT2",
      3,
      5,
      48,
      "5mm Hex, 16mm Bolt Circle"
    ),
    Pulley(
      [Vendor("REV", "https://www.revrobotics.com/rev-45-1823/")],
      "GT2",
      3,
      5,
      60,
      "5mm Hex, 16mm Bolt Circle"
    ),
  ];

  return (
    <table className="table is-hoverable is-narrow">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Type</th>
          <th>Pitch</th>
          <th>Width</th>
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
                pulley.vendors[0].name +
                pulley.teeth +
                pulley.bore +
                pulley.type
              }
            >
              <td>
                {pulley.vendors
                  .map((v) => (
                    <a key={v.name} href={v.url}>
                      {v.name}
                    </a>
                  ))
                  .reduce((prev, curr) => [prev, ", ", curr])}
              </td>
              <td>{pulley.type}</td>
              <td>{pulley.pitch} mm</td>
              <td>{pulley.width} mm</td>
              <td>{pulley.teeth}T</td>
              <td>{pulley.bore}</td>
              <td>{pulley.pd.scalar.toFixed(3)}&quot;</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
