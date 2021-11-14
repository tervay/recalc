# Docs

The time to goal currently **does not** account for deceleration of the arm when approaching the target. It **does** account for the initial acceleration from zero.

The starting angle **must be less than** the ending angle.

### Angles

The angles follow the unit circle; i.e.:

* Upright = 90°
* Parallel to ground = 0° (right) or 180° (left)
* Downwards = 270° or -90°

For example:

* 3/4 of a full rotation: start angle of 0°, end angle of 270°.
* 1/4 of a rotation downwards: start angle of 90°, end angle of 135°.

### Math

This arm calculator iteratively simulates arm states from the starting angle to the end angle. The algorithm is as follows:

1. Set `timeDelta = 0.0005 seconds`. Set `currentArmAngle = startingAngle`. Set `currentArmRpm = 0 rpm`.
2. While `currentArmAngle` is less than `endAngle`:
3. Calculate the momentary downwards torque on the arm due to gravity.
4. Calculate the momentary net arm torque between the gravitational downwards torque and the motors at the current motor speed and current limit.
5. Calculate the momentary net arm angular acceleration, equal to the net arm torque divided by the arm's inertia.
6. Add the momentary net arm angular acceleration multiplied by `timeDelta` to `currentArmRpm`.
7. Add `timeDelta * currentArmRpm + armAngularAccel * 0.5 * timeDelta²` to `currentArmAngle`.
8. Set the current motor speed equal to the `currentArmRpm` multiplied by the gear ratio.
9. Go back to step 2.

Steps 3-9 will only happen up to the iteration limit that you provide. That is, if iterationLimit is 5, that loop will only be executed 5 times. **If the iteration limit is too low, this may result in your arm not reaching your target angle at all!**
