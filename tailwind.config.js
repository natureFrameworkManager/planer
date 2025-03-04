/** @type {import('tailwindcss').Config} */

let pluginObject = {
    '.shadow-elevation-1': { 'box-shadow': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);' },
    '.shadow-elevation-2': { 'box-shadow': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);' },
    '.shadow-elevation-3': { 'box-shadow': '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);' },
};

const plugin = require('tailwindcss/plugin')

module.exports = {
    content: ["*.html", "*/*.php", "*.php"],
    theme: {
        extend: {
            colors: {
                primary: "#EFA78C",
                onPrimary: "#FFFFFF",
                background: "#000D1A",
                onBackground: "#F3DFD8",
                surface: "#F3DFD8",
                onSurface: "#124173",
                surface2: "#978984",
                onSurface2: "#E8EAED",
                success: "#0A8C4F",
                onSuccess: "#FFFFFF",
                onSuccessHeading: "#622A58",
                error: "#E24466",
                onError: "#000000",
                accent1: "#FDEE00",
                accent2: "#FFCAD8",
                select: "#0D4BE8"
            },
            borderWidth: {
                '3': "3px",
                '1': "1px",
                '0.5': "0.5px"
            },
            boxShadow: {
                '3dp-1': '0px 1px 3px 0px #00000026',
                '3dp-2': '0px 4px 4px 0px #00000040'
            },
            gridTemplateColumns: {
                '5-1fr': 'repeat(5, minmax(0, 1fr))',
                '7-1fr': 'repeat(7, minmax(0, 1fr))',
                '8-1fr': 'repeat(8, minmax(0, 1fr))',
                '10-1fr': 'repeat(10, minmax(0, 1fr))',
                '12-1fr': 'repeat(12, minmax(0, 1fr))',
                '5-72': 'repeat(5, minmax(0, 72px))',
                '8-72': 'repeat(8, minmax(0, 72px))',
                '10-72': 'repeat(10, minmax(0, 72px))',
                '12-72': 'repeat(12, minmax(0, 72px))',
                '2-min': 'repeat(2, minmax(0, min-content))',
                '3-min': 'repeat(3, minmax(0, min-content))',
                '5-min': 'repeat(5, minmax(0, min-content))',
                '6-min': 'repeat(6, minmax(0, min-content))',
            },
            gridColumn: {
                '1': '1',
                '2': '2',
                '3': '3',
                '4': '4',
                '5': '5',
                '6': '6',
                '7': '7',
                '8': '8',
                '9': '9',
                '10': '10',
                '11': '11',
                '12': '12',
            },
            gridRow: {
                '1': '1',
                '2': '2',
                '3': '3',
                '4': '4',
                '5': '5',
                '6': '6',
                '7': '7',
                '8': '8',
                '9': '9',
                '10': '10',
                '11': '11',
                '12': '12',
            },
            content: {
                'empty': 'll',
            },
            padding: {
                "6px": "6px"
            },
            margin: {
                '22': '5.5rem',
            },
            transitionProperty: {
                'width': 'width',
                'height': 'height',
                'dimensions': "width, height",
                'spacing': 'margin, padding',
            },
            keyframes: {
                spinReverse: {
                    'to': { transform: 'rotate(-360deg)' },
                }
            },
            animation: {
                spinReverse: 'spinReverse 1s linear infinite',
                spinReverseSlow: 'spinReverse 1.5s linear infinite',
            },
            backgroundImage: {
                'home-blur': "url('/assets/img/bg-home-large.svg')"
            }
        },
        listStyleType: {
            disc: 'disc',
            circle: 'circle',
            square: 'square',
            decimal: 'decimal',
            decimalleadingzero: 'decimal-leading-zero',
            lowerroman: 'lower-roman',
            upperroman: 'upper-roman',
            lowergreek: 'lower-greek',
            lowerlatin: 'lower-latin',
            upperlatin: 'upper-latin',
            armenian: 'armenian',
            georgian: 'georgian',
            loweralpha: 'lower-alpha',
            upperalpha: 'upper-alpha',
            none: 'none',
        },
        fontSize: {
            "body-large": ["16px", "19px"],
            "body-medium": ["14px", "17px"],
            "body-small": ["12px", "15px"],
            "label-large": ["14px", "17px"],
            "label-medium": ["12px", "15px"],
            "label-small": ["11px", "13px"],
            "title-large": ["22px", "27px"],
            "title-medium": ["16px", "19px"],
            "title-small": ["14px", "17px"],
            "headline-large": ["32px", "39px"],
            "headline-medium": ["28px", "34px"],
            "headline-small": ["24px", "29px"],
            "display-large": ["57px", "69px"],
            "display-medium": ["45px", "54px"],
            "display-small": ["36px", "44px"],
            "icon": ["24px"],
            "icon-large": ["32px"],
            "icon-mega": ["48px"]
        },
        screens: {
            "xs": "375px",
            "sm": "600px",
            "smd": "900px",
            "md": "1240px",
            "lg": "1440px",
            "xl": "1640px"
        },
        gridTemplateColumns: {
            '1': 'repeat(1, minmax(auto, 1fr))',
            '2': 'repeat(2, minmax(auto, 1fr))',
            '3': 'repeat(3, minmax(auto, 1fr))',
            '4': 'repeat(4, minmax(auto, 1fr))',
            '5': 'repeat(5, minmax(auto, 1fr))',
            '6': 'repeat(6, minmax(auto, 1fr))',
            '7': 'repeat(7, minmax(auto, 1fr))',
            '8': 'repeat(8, minmax(auto, 1fr))',
            '9': 'repeat(9, minmax(auto, 1fr))',
            '10': 'repeat(10, minmax(auto, 1fr))',
            '11': 'repeat(11, minmax(auto, 1fr))',
            '12': 'repeat(12, minmax(auto, 1fr))',
        },
        backgroundSize: {
          'auto': 'auto',
          'cover': 'cover',
          'contain': 'contain',
          '100': '100%',
          '100x100': '100% 100%',
        }
    },
    plugins: [
        require('@tailwindcss/forms'),
        plugin(function ({ addUtilities }) {
            addUtilities(
                pluginObject
            )
        }),
    ]
}