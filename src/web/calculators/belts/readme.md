# Docs

### Math

The formulas used in this calculated were taken from [SDP-SI's formulas](https://www.sdp-si.com/Belt-Drive/Designing-a-miniature-belt-drive.pdf). Specifically, formulas 2, 3, and 5 are used.

The first step is to take the user's desired center-center (C-C)
distance and calculate a hypothetical belt that would result in that
exact C-C distance. The measurement we are looking for here is known as
the **pitch length** of the belt (or the **datum length**). We do this by using formula 2. The derivation for this formula is actually some fairly [straightforward geometry](https://www.linearmotiontips.com/v-belt-pitch-length-datum-length/)!

Suppose that we've now calculated our hypothetical belt to have a pitch length of 12.36 inches. We can convert a belt's pitch length to belt teeth by dividing the pitch length of the belt by the pitch of the belt. Typically in FRC, this is either 3mm or 5mm. Let's suppose its 3mm, or 0.11811 inches. 12.36 inches divided by 0.11811 inches is roughly 104.7 - so our hypothetical belt for our system to have the exact C-C we want has 104.7 teeth.

Obviously, we can't have a belt with a fraction of a tooth, so we round this number to the nearest multiple of the user's `Belt Tooth Increment` input. Most belts from FRC vendors are sold with tooth counts in multiples of 5, but other belt manufacturers (such as BBMan) may also sell belts with tooth counts that are multiples of the pitch (in millimeters).

The calculator outputs 2 options, rounding up and down to the nearest multiples, so that you can choose whether you want to go slightly shorter or slightly longer than your target C-C, depending on the constraints you're designing around.

### [HTD vs GT2/3](https://www.sdp-si.com/D265/PDF/D265T003.pdf)

HTD, or High Torque Drive, is a standard for a specific tooth shape on a timing belt. GT2 (Gates Tooth 2), sometimes referred to as PowerGrip GT2, is a secondary revision of HTD with a deeper tooth profile. HTD was developed in order to transmit high torque, but does not excel in high precision scenarios, as it inherently contains a sizeable amount of backlash. HTD and GT2 belts & pulleys are not recommended by Gates to be intermingled, due to load ratings, [but it's been done in FRC before](https://www.chiefdelphi.com/t/do-gt2-belts-work-on-htd-pulleys-reliably/148179), as not every subsystem may reach that load rating maximum.

[GT3 is a further revision of GT2](https://www.sdp-si.com/products/GT-Timing-Belts-and-Pulleys.php), and GT3 belts work with GT2 pulleys seamlessly. GT3 offers a marginal increase in load capacity.

###### URL Mirrors:

- [Formulas](https://web.archive.org/web/20201022032018/https://www.sdp-si.com/Belt-Drive/Designing-a-miniature-belt-drive.pdf)
- [Pitch length formula derivation](https://web.archive.org/web/20200803213303/https://www.linearmotiontips.com/v-belt-pitch-length-datum-length/)
- [HTD vs GT2](https://web.archive.org/web/20210608142137/https://www.sdp-si.com/D265/PDF/D265T003.pdf)
- [Mixing HTD and GT2](https://web.archive.org/web/20210707201852/https://www.chiefdelphi.com/t/do-gt2-belts-work-on-htd-pulleys-reliably/148179)
- [GT3](https://web.archive.org/web/20210707192632/https://www.sdp-si.com/products/GT-Timing-Belts-and-Pulleys.php)
