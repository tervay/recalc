# Docs

The system may not necessarily stop exactly at the travel distance. This is due to the simulation timestep being too large in order for the graphs to update much faster. It is unlikely your system will perfectly follow the profile due to imperfect PID tuning anyhow.

**This is not a perfect profile generator.** The available acceleration from the motors is set equal to

$$ a = k_T * I * n * R * \frac{e}{100} $$

where $k_T$ is the motor torque constant, $I$ is the min of stall current and current limit, $n$ is the number of motors in the gearbox, $R$ is the ratio of the gearbox (where $R$ > $1$ is a reduction), and $e$ is the efficiency (as a number between 0 and 100, inclusive.)

This means it *does not account for system friction*, voltage ramping, or PID tuning.

The graph is generated by simulating timesteps with the acceleration determined to be available, up to the maximum velocity determined to be available. Again, *this does not account for voltage ramping or PID tuning.*

This is to be used as an estimate, not as a perfect simulation of a theoretical system. [WPILib's `ElevatorSim` class](https://github.wpilib.org/allwpilib/docs/release/java/edu/wpi/first/wpilibj/simulation/ElevatorSim.html) is a more accurate representation of reality.

### Math

For cases where the system cannot reach the theoretical max velocity, the velocity profile looks like a scalene triangle rather than a trapezoid. The times for the acceleration and deceleration phases are derived as follows. $a_1$ is the acceleration, $a_2$ is the deceleration, $D$ is the total distance traveled, $t_1$ is the time of acceleration, and $t_2$ is the time of deceleration.


$$ a_1 t_1 = a_2 t_2 $$
$$ \frac{a_1t_1}{a_2} = t_2 $$
$$ D = d_1 + d_2 $$
$$ d_1 = \frac{1}{2} base * height $$
$$ d_1 = \frac{1}{2} (t_1) (a_1 t_1) $$
$$ d_1 = \frac{1}{2} a_1 t_1^2 $$
$$ \therefore d_2 = \frac{1}{2} a_2 t_2^2 $$
$$ D = \frac{1}{2} a_1 t_1^2 +  \frac{1}{2} a_2 t_2^2 $$
$$ D = \frac{1}{2} (a_1 t_1^2 + a_2 t_2^2) $$
$$ D = \frac{1}{2} (a_1 t_1^2 + a_2 (\frac{a_1t_1}{a_2})^2) $$

[Then solve for $t_1$...](https://www.wolframalpha.com/input?i=solve+D+%3D+1%2F2+*+%28a_1+*+t_1%5E2+%2B+a_2+*+%28a_1+*+t_1+%2F+a_2%29%5E2%29+for+t_1)

$$
t_1 = \frac{\sqrt{2 D a_2}}{\sqrt{a_1 (a_1 + a_2)}}
$$

Now we have $t_1$, so it is easy to find $t_2$ based on the first set of equations we established.