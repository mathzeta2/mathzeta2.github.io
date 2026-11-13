"""Original companion examples for zeta2's Manim beginner guide.
Tested with Manim Community 0.19.2. SecantToTangent requires LaTeX.
Render: manim -qm manim_starter.py FirstAnimation SecantToTangent
"""
from manim import *


class FirstAnimation(Scene):
    def construct(self):
        title = Text("My first Manim scene", font_size=36).to_edge(UP)
        square = Square(side_length=2, color=BLUE)
        circle = Circle(radius=1, color=GOLD)
        self.play(Write(title), Create(square))
        self.play(square.animate.rotate(PI / 4))
        self.play(Transform(square, circle))
        self.play(square.animate.set_fill(GOLD, opacity=0.4))
        self.wait(1)


class SecantToTangent(Scene):
    def construct(self):
        axes = Axes(
            x_range=[0, 3, 1], y_range=[0, 9, 3],
            x_length=7, y_length=3.8,
            axis_config={"include_tip": False},
        ).shift(UP * 0.15)
        graph = axes.plot(lambda x: x**2, x_range=[0, 2.8], color=BLUE)
        formula = MathTex(r"f(x)=x^2,\quad f'(1)=2").to_edge(UP)
        h = ValueTracker(1.4)
        point_p = Dot(axes.c2p(1, 1), color=WHITE)
        point_q = always_redraw(lambda: Dot(
            axes.c2p(1 + h.get_value(), (1 + h.get_value())**2), color=GOLD
        ))
        secant = always_redraw(lambda: axes.get_secant_slope_group(
            x=1, graph=graph, dx=h.get_value(),
            secant_line_length=5, secant_line_color=GOLD,
        ))
        h_label = MathTex("h=").scale(0.7).to_corner(UL).shift(DOWN)
        h_number = DecimalNumber(1.4, num_decimal_places=2).scale(0.7)
        h_number.add_updater(lambda m: m.set_value(h.get_value()).next_to(h_label, RIGHT))
        self.play(Create(axes), Create(graph), Write(formula))
        self.add(h_label, h_number, point_p, point_q, secant)
        self.play(h.animate.set_value(0.08), run_time=5, rate_func=smooth)
        tangent = axes.plot(lambda x: 2*x - 1, x_range=[0.5, 2.5], color=GREEN)
        limit_formula = MathTex(r"\frac{(1+h)^2-1}{h}=2+h\longrightarrow 2")
        limit_formula.scale(0.75).to_edge(DOWN)
        self.play(Create(tangent), Write(limit_formula))
        self.wait(2)
