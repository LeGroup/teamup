package slider
{
	import mx.core.UIComponent;

	public class SliderTrack extends UIComponent
	{
			override public function get height():Number{
	            return 20;
	        }

        override protected function updateDisplayList(unscaledWidth:Number, unscaledHeight:Number):void{
            super.updateDisplayList(unscaledWidth, unscaledHeight);

            //create 2 circle that will act like round corners
            var rw:Number=(unscaledWidth/3)-1;
            this.graphics.lineStyle(1, 0xaaaaaa);
            this.graphics.moveTo(-24,-4);
            this.graphics.lineTo(unscaledWidth,-4);
            this.graphics.moveTo(-24,-4);
            this.graphics.lineTo(-24,4);
            this.graphics.moveTo(0,-4);
            this.graphics.lineTo(0,4);
            this.graphics.moveTo(rw,-4);
            this.graphics.lineTo(rw,4);
            this.graphics.moveTo(rw+rw,-4);
            this.graphics.lineTo(rw+rw,4);

        }

	}
}