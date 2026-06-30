"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function HorizontalAbout() {

    const targetRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"],
    });

    const x = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", "-66.67%"]
    );

    return (

        <section
            ref={targetRef}
            className="relative h-[300vh]"
        >

            <div className="sticky top-0 h-screen overflow-hidden">

                <motion.div
                    style={{ x }}
                    className="flex h-full w-[300vw]"
                >

                    {/* PANEL 1 */}

                    <section className="w-screen h-screen flex items-center px-20">

                        <div className="grid lg:grid-cols-2 gap-20 items-center w-full">

                            <div>

                                <p className="uppercase tracking-[6px] text-cyan-400 mb-4">
                                    THE FEST
                                </p>

                                <h2 className="font-display text-6xl font-bold mb-8">
                                    About Conscientia
                                </h2>

                                <p className="text-gray-300 leading-8 text-lg">
                                    Conscientia is the annual technical festival
                                    of IIST bringing together innovators,
                                    researchers and students through workshops,
                                    competitions, keynote talks and cutting-edge
                                    technology experiences.
                                </p>

                            </div>

                            <div className="relative h-[550px] rounded-3xl overflow-hidden">

                                <Image
                                    src="/images/conscientia.jpg"
                                    alt=""
                                    fill
                                    className="object-cover"
                                />

                            </div>

                        </div>

                    </section>

                    {/* PANEL 2 */}

                    <section className="w-screen h-screen flex items-center px-20">

                        <div className="grid lg:grid-cols-2 gap-20 items-center w-full">

                            <div className="relative h-[550px] rounded-3xl overflow-hidden">

                                <Image
                                    src="/images/iist-building.jpg"
                                    alt=""
                                    fill
                                    className="object-cover"
                                />

                            </div>

                            <div>

                                <p className="uppercase tracking-[6px] text-cyan-400 mb-4">
                                    OUR INSTITUTE
                                </p>

                                <h2 className="font-display text-6xl font-bold mb-8">
                                    IIST
                                </h2>

                                <p className="text-gray-300 leading-8 text-lg">

                                    Indian Institute of Space Science and
                                    Technology is India's premier institution
                                    dedicated to space science, engineering and
                                    research under the Department of Space.

                                </p>

                            </div>

                        </div>

                    </section>

                    {/* PANEL 3 */}

                    <section className="w-screen h-screen flex items-center justify-center px-20">

                        <div className="max-w-6xl w-full">

                            <p className="uppercase tracking-[6px] text-cyan-400 mb-4 text-center">
                                WHY CONSCIENTIA
                            </p>

                            <h2 className="font-display text-6xl text-center font-bold mb-20">
                                More Than A Fest
                            </h2>

                            <div className="grid md:grid-cols-4 gap-8">

                                {[
                                    "Innovation",
                                    "Networking",
                                    "Competitions",
                                    "Learning",
                                ].map((item) => (

                                    <div
                                        key={item}
                                        className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8 hover:border-cyan-400 transition-all duration-500 hover:-translate-y-2"
                                    >

                                        <h3 className="text-2xl font-bold mb-4">
                                            {item}
                                        </h3>

                                        <p className="text-gray-400">
                                            Experience excellence through
                                            technology and collaboration.
                                        </p>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </section>

                </motion.div>

            </div>

        </section>

    );

}