# Docs

This is essentially a direct port of [Julia's hooded flywheel calculator](https://www.chiefdelphi.com/t/flywheel-calculator/372836).

This assumes the flywheel is connected to the shooter wheels directly, either coaxially, via gears, or via belts. This does not account for MOI of any pulleys, gears, or the DC motors themselves - just the shooter wheel(s) and flywheel(s).

This also assumes the motor is outputting the maximum torque allowed by the current limit (i.e. at stall), and that you have a perfectly tuned controller. Your real windup time will be slightly longer than displayed.

Note that the `shooter max speed` and `target shooter RPM` cannot be equal - the function to estimate windup time is not defined in this case (log of zero). If you want to get the motor to max possible speed, simply set the target RPM to 1 less than the max RPM.

### Flywheel MOI

Note that the flywheel MOI effective to the motors is multiplied by the gear ratio **squared**.

Note the following:

$$ K = \frac{1}{2}Iw^2 $$
$$ I = \frac{1}{2}mr^2 $$

We can then substitute in $I$:

$$ K = \frac{1}{2} ( \frac{1}{2} m\_{fly} r\_{fly}^2 ) w^2 $$

However, note that $w$ should have our gear ratio $R$:

$$ K = \frac{1}{2} ( \frac{1}{2} m_{fly} r_{fly}^2 ) (w\_{wheel}R)^2 $$

$$ \text{Let} \space I_{fly} = \frac{1}{2} m_{fly} r\_{fly}^2 R^2 $$

$$ K_{fly} = \frac{1}{2} I_{fly} w\_{wheel}^2 $$

As you can see, the MOI for a flywheel has a squared ratio term for the moment of inertia. Be careful to remember this in custom MOI calculations!

### Spin-up time

First, lets establish some variables:

- $V_a$ - applied voltage (volts)
- $I$ - current (amps)
- $R$ - DC motor resistance (ohms)
- $T_{stall}$ - stall torque (newton meters)
- $J$ - moment of inertia of the system (in^2 lbs)
- $w$ - motor angular velocity (rpm)
- $w_{max}$ - motor free speed (rpm)
- $K_v$ - DC motor velocity constant (rpm/volt) = $w_{max}/12V$
- $K_t$ - DC motor torque constant (newton meters/amp) = $T_{stall}/(I_{stall}-I_{free})$

Under a constant voltage, a DC motor follows the following equation

$$
w = K_v V (1 - e^{(-t K_t) / {(JRK_v)}})
$$

We need to rearrange this formula and solve for $t$. Doing so yields

$$
t = -\frac{JRK_v}{K_t}ln(-\frac{w - VK_v}{VK_v})
$$

Note the first term, $\frac{JRK_v}{K_t}$. Let's cast aside the MOI $J$ for now and focus on $\frac{RK_v}{K_t}$.

We may notice that $R/K_t$ simplifies to $V/T_{stall}$. We can use that to further simplify to

$$
\frac{RK_v}{K_t} = \frac{K_vV}{T_{stall}} = \frac{\frac{w_{max}}{V}V}{T_{stall}} = \frac{w_{max}}{T_{stall}}
$$

Note that $T_{stall}$ changes based on the current limit of the motor and the quantity of motors in the system. These constants are a lot easier to work with than $R$, $K_v$, and $K_t$, and our formula is now

$$
t = -\frac{Jw_{max}}{T_{stall}}ln(-\frac{w - VK_v}{VK_v})
$$

We can further simplify this by noting that $VK_v=w_{max}$:

$$
t = -\frac{Jw_{max}}{T_{stall}}ln(-\frac{w - w_{max}}{w_{max}})
$$

and distributing a negative sign:

$$
t = -\frac{Jw_{max}}{T_{stall}}ln(\frac{w_{max} - w}{w_{max}})
$$

And now we have a fairly approachable formula that we can use!

### Projectile Speed Estimation

FRC Team 846 [derived some math](https://web.archive.org/web/20150920073053/https:/lynbrookrobotics.com/resourcefiles/whitepages/2012/Shooter%20Calculations%20Document.pdf) regarding this back in 2012.

##### URL Mirrors:

- [Julia's design calculator](https://web.archive.org/web/20210720015734/https://www.chiefdelphi.com/t/flywheel-calculator/372836)
- [FRC Team 846 speed transfer math](https://web.archive.org/web/20150920073053/https:/lynbrookrobotics.com/resourcefiles/whitepages/2012/Shooter%20Calculations%20Document.pdf)
