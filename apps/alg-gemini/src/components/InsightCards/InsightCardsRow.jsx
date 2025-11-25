import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Activity, TrendingUp } from 'lucide-react';

const Card = ({ icon: Icon, value, subtitle, colorClass, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4, boxShadow: "0 26px 70px rgba(15, 23, 42, 0.14)" }}
        className="flex-1 min-w-[260px] p-8 bg-surface-default rounded-radius-lg shadow-soft border border-border-subtle flex flex-col items-start gap-5 group transition-shadow duration-300"
    >
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-colors duration-300`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <div className="text-2xl font-bold text-text-main mb-1 tracking-tight">{value}</div>
            <div className="text-sm text-text-muted font-medium">{subtitle}</div>
        </div>
        <div className="w-full h-[1px] bg-border-subtle mt-auto" />
        <div className="text-xs text-text-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
            Based on your recent activity.
        </div>
    </motion.div>
);

const InsightCardsRow = () => {
    return (
        <section className="w-full py-12 px-6 bg-gradient-to-b from-bg-page to-white">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-6 justify-center items-stretch">
                <Card
                    icon={Shield}
                    value="Left-Leaning"
                    subtitle="Political Alignment"
                    colorClass="bg-primary-blue text-primary-blue"
                    delay={0}
                />
                <Card
                    icon={User}
                    value="24 - 30"
                    subtitle="Predicted Age"
                    colorClass="bg-accent-purple text-accent-purple"
                    delay={0.1}
                />
                <Card
                    icon={Activity}
                    value="High Anxiety"
                    subtitle="Emotional Signal"
                    colorClass="bg-accent-red text-accent-red"
                    delay={0.2}
                />
                <Card
                    icon={TrendingUp}
                    value="Top 5%"
                    subtitle="Valuable User"
                    colorClass="bg-accent-green text-accent-green"
                    delay={0.3}
                />
            </div>
        </section>
    );
};

export default InsightCardsRow;
