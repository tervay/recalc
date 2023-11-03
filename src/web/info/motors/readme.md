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

Let's not forget about our main breaker! We can find the datasheet [here](https://cdn.andymark.com/media/W1siZiIsIjIwMTkvMDEvMjMvMTEvMjgvMTkvYmQ1NTZmZTAtNGM0MS00MDdmLThjOTEtNWU4YjNjNDIxNjc1L2FtLTAyODJfZGF0YV9zaGVldC5wZGYiXV0/am-0282_data_sheet.pdf?sha=7d1e6f3a91aa5184). In this case, our rated current is 120A - the main breaker can hold 120A for a long time (>500 seconds), and can hold 240A for ~10 seconds. Our maximum current draw is 387A, or of 322% rated current; it's a bit hard to see on the graph, but it seems the main breaker would be able to sustian that for between 3.5ish and 10ish seconds.

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

#### Motor Constants

The first 'motor constant' you will often encounter is $K_V$. This is a measurement of a motor's free speed per volt applied. For example, the NEO has a free speed of 5880 RPM at 12V, so the NEO's $K_V$ is equal to $\frac{5880rpm}{12V}=490\frac{rpm}{V}$.

It is important to note that voltage requires two reference points to measure. In a single phase system, you measure voltage between the phase and neutral. This is referred to as line-neutral voltage. In a three phase system, you can alternatively measure voltage between two phases; this is called line-line voltage. Line-neutral and line-line voltage can be converted using the following equation:

$$ V_{LL} = \sqrt{3} \times V_{LN} $$

Many brushless DC motors are three phase systems, and many motor manufacturers will list $K_V$ using line-line voltages. In FIRST, we typically exclusively encounter line-neutral voltage.

The second motor constant you may encounter is $K_e$, or *back-EMF constant*. You must be very careful with units here. Often, $K_e$ is defined as $\frac{1}{K_V}$. **This definition assumes that $K_V$ and $K_e$ are defined using the same units of rotation** (ie, rpm or rad/s). However, this is not always the case.

* $K_V$ is typically expressed in units of rpm per volt.
* $K_e$ is typically expressed in units of volt-seconds per radian.

Make sure to keep track of which units you are using between rpm and rad/s.

The third motor constant you will typically encounter is $K_T$, or the torque constant. This is a measure of motor torque per amp of armature current applied. For a three-phase brushless motor with a $K_V$ measured by line-line voltage, $K_T$ can be expressed as:

$$ K_T = \frac{3}{2} \times \frac{1}{\sqrt{3}} \times \frac{60}{2\pi} \times \frac{1}{K_V} $$

The $\frac{3}{2}$ originates from the brushless DC motor torque equation, the $\frac{1}{\sqrt{3}}$ converts line-line voltage to line-neutral voltage, and $\frac{60}{2\pi}$ converts from RPM to rad/s. Since the motor specs given by FRC vendors are measured with line-neutral voltage (12V), this can be modified to:

$$ K_T = \frac{3}{2} \times \frac{60}{2\pi} \times \frac{1}{K_V} $$

To get the total torque applied to the motor, multiply this by the applied armature current.

It is important to note that this is a measure of "electromagnetic" torque per amp; **not** usable torque per amp. Because we live in a universe with losses, the usable torque, or "shaft" torque, will be strictly less than this theoretical torque.

The fourth motor constant you may encounter is $K_M$, or, uninspiringly, *the motor constant*. This constant is defined as any of the following:

$$ K_M = \frac{K_TI}{\sqrt{P}} = \frac{K_TI}{\sqrt{I^2R}} = \frac{K_T}{\sqrt{R}} $$

where $P$ is the resistive power loss and $R$ is the motor's resistance.

Expressed in units newton-meters per square root watt, the motor constant describes the fundamental ability of the motor to transform electrical power into mechanical power. This constant brings us some important insights to the world of motors.

Let's look at the first equality. Since $K_M$ and $K_T$ are constants, they mustn't change. We can rearrange the equation to have constants on one side and variables on the right:

$$ \frac{K_M}{K_T} = \frac{I}{\sqrt{P}} $$

This means if you *double* the input current, you *quadruple* the resistive power losses. However, if you instead run 2 motors at the original current in a gearbox together, your resistive power losses double, rather than quadruple. This is part of the reason why stacking motors in the drivetrain surged in popularity in 2023 - having $N$ motors at $X$ amps results in less resistive power loss than $\frac{N}{2}$ motors at $2X$ amps.

---

Sources:

[1] R. Parsons, “ How to estimate the torque of a BLDC (PMSM) electric motor using only its Kv and current draw,” _Things in Motion_, Dec. 25, 2018. https://things-in-motion.blogspot.com/2018/12/how-to-estimate-torque-of-bldc-pmsm.html

[2] J. Mevey, “SENSORLESS FIELD ORIENTED CONTROL OF BRUSHLESS PERMANENT MAGNET SYNCHRONOUS MOTORS,” MSc Thesis, 2009. Accessed: Nov. 03, 2023. [Online]. Available: https://krex.k-state.edu/bitstream/handle/2097/1507/JamesMevey2009.pdf

[3] R. Queen, “KM - Motor Constant - ‘THE GREAT EQUALIZER’ ,” Wayback Machine, Jan. 16, 2008. https://web.archive.org/web/20210413125847/http://www.motioncomp.com/pdfs/Motor_Constant_Great_Equalizer.pdf (accessed Nov. 03, 2023).