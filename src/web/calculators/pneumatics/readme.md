# Docs

##### Pistons & Pneumatic Cylinders

The timeline shown in the graph is generated iteratively. We initially create a system with the user's inputted volume at 115psi. The system is then simulated over a length of 150 seconds, or an FRC match length.

Each cylinder is **retracted by default**. It is then toggled every few seconds based on the `Toggle State Every` input. For example, if the input is `8 s`, then it will be extended 8 seconds into the match, retracted 16 seconds into the match, extended again 24 seconds into the match, and so on.

Here is an image with labels for the corresponding specs of a pneumatic cylinder:

todo: fixme

I recommend watching [this video](https://www.youtube.com/watch?v=R-OBtVCPjMc) to get a brief understanding of how pneumatic cylinders work.

##### Compressors

The compressor will automatically enable below 95psi, and will automatically disable above 120psi.

Compressors vary in performance based on the psi of the system they are feeding into. Their performance is typically measured in cubic feet per minute, or CFM. Vendors typically provide a table of CFM values at different pressures, eg CFM at 0psi, CFM at 10psi, etc.

Note that this isn't a continuous range, so we need to run a polynomial regression on these values in order to generate a function that takes a given pressure and outputs a relatively correct CFM value. **This isn't perfect**, but it gets us a lot of the way there and can serve as a good estimate.

Note that some of the compressors listed have 13.8V options - our systems run at 12V, not 13.8V. However, the data provided by the suppliers for those compressors did not include any data taken at 12V, with the exception of the VIAIR 90C being tested at 12V by AndyMark. If you are using one of the compressors that is only listed under 13.8V, you should compare the difference in performance between the VIAIR 90C at 12V and 13.8V and guesstimate how your system will perform under 12V rather than the calculated 13.8V.

### Math

##### Extension Force

As the rear of cylinder fills with air, the force generated is equal to the total internal volume of the cylinder multiplied by the PSI, as the rod does not occupy any of the volume being expanded by the incoming air supply.

```
extensionForce = pressure * (π * (boreDiameter / 2)²)
```

##### Retraction Force

As the front of the cylinder fills, there is a volume of the cylinder occupied by the rod, so the retraction force is slightly less than the extension force.

```
retractionForce = pressure * (π * ((boreDiameter / 2)² - (rodDiameter / 2)²))
```

##### Work

Once we have the forces generated, we can calculate how much work each action requires to complete, which is simply `force * distance`, and in this case, distance is equal to the stroke length of the cylinder.

##### Compressors

Now that we have a function that estimates CFM at any given pressure (0-120psi for our systems), we can estimate how much work the compressor does in a given timeframe. Over a period of one second, a compressor will do `cfmAtCurrentPressure * 1 second * 1 atmosphere` joules of work. This comes from the formula for [pressure-volume work (PV work)](https://www.khanacademy.org/science/ap-chemistry/thermodynamics-ap/internal-energy-tutorial-ap/a/pressure-volume-work), where `W = PV`; `V` is equal to `cfmAtCurrentPressure * 1 second` and `P` is equal to 1 atmosphere (the external air pressure).

##### Tying it together

Note that we have work (in Joules) for both the cylinders and the compressor. Combining them will give us either a net positive work or a net negative work for the system over the last second. (Note that if a cylinder didn't extend or retract within the last second, the work that it did is simply 0.)

Recall again the PV work formula, `W = PV`. Since we have the work in the system over the last second, and our volume is constant, we can calculate the pressure differential over the last second as simply `P = W / V`. Now, we can add this pressure differential to our system's pressure from one second ago, and we can then continue this for the full length of the matc.

##### URL Mirrors

- [PV work](https://web.archive.org/web/20201024100339/https://www.khanacademy.org/science/ap-chemistry/thermodynamics-ap/internal-energy-tutorial-ap/a/pressure-volume-work)
