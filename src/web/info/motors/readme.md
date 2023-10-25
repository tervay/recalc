# DC motors from 10,000 feet

DC motors are complex but fascinating devices. There are dozens of variables that go into a motor's performance, and this will not attempt to cover all of them. This reading assumes that you have an understanding of Ohm's Law and basic physics.

#### Brushed, Brushless, and Basics

You should watch the following two videos to gain an understanding of the differences between brushed motors and brushless motors. In FRC, our brushless motor options are the NEO, NEO Vortex, NEO 550, Falcon 500, and the Kraken X60. All other motors are brushed.

* Brushed: https://www.youtube.com/watch?v=LAtPHANEfQo
* Brushless: https://www.youtube.com/watch?v=bCEiOnuODac

For our purposes, brushed & brushless motors are mathematically identical.

#### The FRC Power System

Our batteries are typically ~12.6V fully charged. A new battery will have an effective resistance of ~0.015Ω. This resistance will increase with use, and decrease with temperature. SLA batteries are also complicated and also have lots of variables; however, these will not be covered here.

Notably, voltage is a measure of *potential* energy. By drawing a current to a device, the available *potential* energy of the battery decreases. But how much current can we draw at a given time? Well, if we draw too much, we will *brown out* - you can read more about this from [WPILib](https://docs.wpilib.org/en/stable/docs/software/roborio-info/roborio-brownouts.html). Let's assume our brownout voltage is 6.8V - we can use Ohm's Law to find our maximum current draw.

$$ V = IR $$
$$ (12.6 - 6.8) = I(0.015) $$
$$ I = 386.67 $$

With a decently good battery, we can draw around 387A before we start to brown out. But with a battery in not-so-good condition:

$$ (12.6 - 6.8) = I(0.020) $$
$$ I = 290 $$

We lose out on nearly 100A. This is why battery condition is so important; a crappy battery leaves a huge amount of performance on the table.

It's also important to note that our motor power is run through breakers. These breakers are thermally activated - as current flows through them, they warm up, and the metal inside deforms. Once the metal deforms enough, the circuit is broken, and current can no longer flow through them. This allows the breaker to cool, which will deform the metal back into a place where the circuit is completed, and current can flow again.

You can find out how long a breaker will sustain a given current draw by reading its data sheet. For example, [REV's 40A breakers](https://www.revrobotics.com/content/docs/REV-11-1860-1863-DS.pdf). Note that this data sheet uses "rated current" - this varies per model. Most of our motors are running on 40A breakers.

You'll see that these breakers can hold 40A ... forever. Or at least for 1800 seconds (30 minutes). For 200% the rated current, or 80A, it will hold for between 5 and 60 seconds, but typically around 18 seconds.

Let's not forget about our main breaker! We can find the datasheet [here](https://cdn.andymark.com/media/W1siZiIsIjIwMTkvMDEvMjMvMTEvMjgvMTkvYmQ1NTZmZTAtNGM0MS00MDdmLThjOTEtNWU4YjNjNDIxNjc1L2FtLTAyODJfZGF0YV9zaGVldC5wZGYiXV0/am-0282_data_sheet.pdf?sha=7d1e6f3a91aa5184). In this case, our rated current is 120A - the main breaker can hold 120% for a long time (>500 seconds), and can hold 240A for ~10 seconds. Our maximum current draw is 387A, or of 322% rated current; it's a bit hard to see on the graph, but it seems the main breaker would be able to sustian that for between 3.5ish and 10ish seconds.

The reason this is all important is because you will see *stall current* mentioned on motor specs. This is the maximum current draw the motor could sustain *itself* (for some typically unknown, but often short, amount of time) - it has nothing to do with the power system behind it. For example, the Falcon 500's stall current is 257A; however, that is 642% of our 40A breaker's rated current, which would only last between ~0.25 and ~1.5 seconds. You can do it, but not for long, and you definitely can't do it on multiple motors at once for very long because the main breaker is also a limiting factor.

#### Basic motor specs

The *nominal voltage* of our system is 12V. Most devices are benchmarked to this voltage; our batteries just happen to be able to push out an inconsequential amount more volts.

The *armature current* is the current flowing through the motor coils at a given moment in time. The *supply current* is the current being delivered from the power supply. **These are not necessarily equal.** When you command your motor controller to output 4V to the motor, it does not actually output 4V - it outputs 12V, but only for 4/12 of the time. The remaining 8/12 of the time, it outputs 0V. In a macroscopic view of the motor coils, this averages out to 4V, and can be considered as such.

Now, suppose your supply current is 25A. Remember - the supply voltage to the motor controller is always 12V. This means the power input to the motor controller is $12*25=300$ watts. The motor controller will use a rather miniscule amount of power here; we can round down to zero for simplicity's sake. If the power from the supply is 300W, and the motor's applied voltage is 4V, then what is the armature current?

Power in must equal power out. It won't all be mechanical power - some power will be lost to resistance or friction or others - but power in must equal power out:

$$ P = VI $$
$$ P_{in} = P_{out} $$
$$ 12 * 25 = 4 * I $$
$$ I = 75 $$

Thus, our motor is running at 4V and 75A, while our supply is at 12V and 25A.

The *free speed* of a motor is the maximum rotations per minute a motor will perform under the nominal voltage, with no external load on the system (e.g. no gears, no mechanisms, etc).

These two numbers bring us to our first *motor constant* - $K_V$, or the *motor velocity constant*:

$$ K_V = \frac{w}{V} $$

This is a measure of how many rotations per minute a motor will achieve per volt applied, or $\frac{rpm}{V}$. For example, the 775pro's $K_V$ is $\frac{18730}{12}=1569\frac{rpm}{V}$.

You may also see another constant, named the *back EMF constant* or *electrical constant* - $K_e$ or $K_b$. This is simply the inverse of $K_V$:

$$ K_e = K_b = \frac{1}{K_V} $$

The next motor constant is called the *torque constant*, or $K_T$:

$$ K_T = \frac{𝜏}{I} $$

< More coming in the future. >
